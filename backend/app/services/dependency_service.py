"""Domain service for deterministic, cycle-safe multi-hop dependency traversal."""

from collections import deque
from sqlalchemy.orm import Session

from app.models import Asset, AssetDependency, Service
from app.schemas.asset import (
    AssetDependenciesResponse,
    DependencyEdge,
    DependencyNode,
    DownstreamImpact,
    DownstreamServiceImpact,
    UpstreamDependencyItem,
)


def traverse_asset_dependencies(
    db: Session, asset_id: str, max_depth: int = 5
) -> AssetDependenciesResponse | None:
    """Perform deterministic multi-hop BFS traversal of equipment and service dependencies.

    Protects against dependency cycles using an explicit visited set. Discovers downstream
    equipment, affected mission-critical services, spatial zones, and traversal paths.
    """
    root_asset = (
        db.query(Asset)
        .filter((Asset.id == asset_id) | (Asset.code == asset_id))
        .first()
    )
    if not root_asset:
        return None

    # ── 1. Upstream Dependencies (Direct Parents) ──────────────────────
    upstream_deps = (
        db.query(AssetDependency)
        .filter(AssetDependency.target_asset_id == root_asset.id)
        .all()
    )
    upstream_items: list[UpstreamDependencyItem] = []
    for dep in upstream_deps:
        if dep.source_asset:
            upstream_items.append(
                UpstreamDependencyItem(
                    asset_id=dep.source_asset.id,
                    code=dep.source_asset.code,
                    name=dep.source_asset.name,
                    type=dep.dependency_type,
                    impact_factor=dep.impact_factor,
                    is_redundant=dep.is_redundant,
                )
            )

    # ── 2. Multi-Hop BFS Traversal for Downstream Blast Radius ────────
    # Queue stores: (current_entity_id, current_entity_type, current_depth, path_list)
    queue: deque[tuple[str, str, int, list[str]]] = deque()
    queue.append((root_asset.id, "ASSET", 0, [root_asset.code]))

    visited_nodes: set[str] = {root_asset.id}
    nodes_map: dict[str, DependencyNode] = {}
    edges: list[DependencyEdge] = []
    discovered_paths: list[str] = []

    # Root node
    nodes_map[root_asset.id] = DependencyNode(
        id=root_asset.id,
        code=root_asset.code,
        name=root_asset.name,
        node_type="ASSET",
        category=str(root_asset.category),
        criticality=str(root_asset.criticality),
        depth=0,
        status=str(root_asset.status),
    )

    affected_subsystems: set[str] = set()
    affected_services_dict: dict[str, DownstreamServiceImpact] = {}
    affected_zones: set[str] = set()
    furthest_depth = 0

    while queue:
        curr_id, curr_type, depth, curr_path = queue.popleft()
        if depth > furthest_depth:
            furthest_depth = depth

        if depth >= max_depth:
            continue

        if curr_type == "ASSET":
            # Find dependencies originating from this asset
            dep_records = (
                db.query(AssetDependency)
                .filter(AssetDependency.source_asset_id == curr_id)
                .all()
            )

            for dep in dep_records:
                # 1. Downstream Asset Link
                if dep.target_asset_id and dep.target_asset:
                    tgt_asset = dep.target_asset
                    edge_key = f"{curr_id}->{tgt_asset.id}"
                    edges.append(
                        DependencyEdge(
                            source_id=curr_id,
                            target_id=tgt_asset.id,
                            dependency_type=str(dep.dependency_type),
                            impact_factor=dep.impact_factor,
                            is_redundant=dep.is_redundant,
                        )
                    )

                    affected_subsystems.add(str(tgt_asset.category))
                    if tgt_asset.zone_id:
                        affected_zones.add(tgt_asset.zone_id)

                    new_path = curr_path + [tgt_asset.code]
                    discovered_paths.append(" → ".join(new_path))

                    if tgt_asset.id not in visited_nodes:
                        visited_nodes.add(tgt_asset.id)
                        nodes_map[tgt_asset.id] = DependencyNode(
                            id=tgt_asset.id,
                            code=tgt_asset.code,
                            name=tgt_asset.name,
                            node_type="ASSET",
                            category=str(tgt_asset.category),
                            criticality=str(tgt_asset.criticality),
                            depth=depth + 1,
                            status=str(tgt_asset.status),
                        )
                        queue.append((tgt_asset.id, "ASSET", depth + 1, new_path))

                # 2. Downstream Service Link
                if dep.target_service_id and dep.target_service:
                    tgt_srv = dep.target_service
                    edges.append(
                        DependencyEdge(
                            source_id=curr_id,
                            target_id=tgt_srv.id,
                            dependency_type=str(dep.dependency_type),
                            impact_factor=dep.impact_factor,
                            is_redundant=dep.is_redundant,
                        )
                    )

                    affected_services_dict[tgt_srv.id] = DownstreamServiceImpact(
                        service_id=tgt_srv.id,
                        code=tgt_srv.code,
                        name=tgt_srv.name,
                        criticality=tgt_srv.criticality,
                    )

                    new_path = curr_path + [tgt_srv.name]
                    discovered_paths.append(" → ".join(new_path))

                    if tgt_srv.id not in visited_nodes:
                        visited_nodes.add(tgt_srv.id)
                        nodes_map[tgt_srv.id] = DependencyNode(
                            id=tgt_srv.id,
                            code=tgt_srv.code,
                            name=tgt_srv.name,
                            node_type="SERVICE",
                            category="SERVICE",
                            criticality=str(tgt_srv.criticality),
                            depth=depth + 1,
                            status="ACTIVE",
                        )
                        queue.append((tgt_srv.id, "SERVICE", depth + 1, new_path))

        elif curr_type == "SERVICE":
            # Optional service-to-zone or downstream service traversal
            srv = db.query(Service).filter(Service.id == curr_id).first()
            if srv and "ZONE" in srv.code:
                affected_zones.add(srv.code)

    downstream_impact = DownstreamImpact(
        affected_subsystems=sorted(list(affected_subsystems)),
        affected_services=list(affected_services_dict.values()),
        affected_zones=sorted(list(affected_zones)),
    )

    downstream_assets_count = sum(1 for n in nodes_map.values() if n.node_type == "ASSET" and n.id != root_asset.id)

    return AssetDependenciesResponse(
        asset_id=root_asset.id,
        upstream_dependencies=upstream_items,
        downstream_impact=downstream_impact,
        nodes=list(nodes_map.values()),
        edges=edges,
        max_depth=furthest_depth,
        paths=discovered_paths,
        total_downstream_assets=downstream_assets_count,
        total_affected_services=len(affected_services_dict),
        total_affected_zones=len(affected_zones),
    )
