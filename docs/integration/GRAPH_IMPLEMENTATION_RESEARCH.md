# Graph Implementation Research & Technology Selection

## 1. Overview
In PolarOps Phase 3, the operational dependency graph is a first-class engineering model representing station physical topology, multi-hop BFS blast-radius propagation, and causal cascading failure paths. It is not a decorative diagram.

This document documents the evaluation of candidate graph technologies, layout algorithms, edge routing techniques, and accessibility considerations against Antarctic operational engineering requirements.

---

## 2. Technology Comparison Matrix

| Technology | Strength | Weakness | Fit for PolarOps | Decision |
|---|---|---|---|---|
| **`@xyflow/react` (React Flow 12+)** | Full JSX/HTML nodes, built-in pan/zoom/minimap, active maintenance, rich custom node model. | Heavy bundle (~85 KB gzip), requires external layout engine (`dagre`/`elkjs`) for automatic node positioning, React 19 peer-dependency sensitivities with state managers. | High for open-ended node editors; moderate overhead for read-only / operational inspection DAGs. | Evaluated — Recommended for general diagramming, but adds unnecessary dependency weight and styling indirection when backend already provides BFS depth ranks. |
| **`ELK / elkjs` (Eclipse Layout Kernel)** | World-class hierarchical and layered DAG layout algorithms, ports robust Java Eclipse algorithms, handles dense multi-tier graphs and port constraints. | Very large bundle (~1.5 MB uncompressed, ~250 KB gzip), asynchronous layout calculation, steep configuration API curve, overkill for <50 node station topologies. | High for complex microservice topologies (1000+ nodes); excessive complexity for station infrastructure DAGs. | Evaluated — Deffered due to bundle footprint and async layout latency on edge devices. |
| **`Dagre`** | Simple, synchronous directed graph layout, lightweight (~30 KB), proven Sugiyama-style layered layout algorithm. | Effectively unmaintained upstream repository, poor handling of node ports/clustering, rigid layout parameters. | Moderate for basic trees. | Evaluated — Rejected due to stale maintenance and lack of dynamic node dimension adaptivity. |
| **`Cytoscape.js`** | Extensive graph theory algorithms (BFS, DFS, shortest path, centrality), battle-tested in bioinformatics and network analysis. | Imperative canvas/WebGL rendering model, cumbersome integration with React 19 declarative state, limited DOM accessibility for screen readers. | Moderate for raw analytical graphs; poor fit for rich React UI cards. | Rejected — Canvas rendering eliminates standard HTML/CSS operational card styling and DOM accessibility. |
| **Tailored Operational SVG/DOM Layered DAG Engine** | Zero third-party dependencies, instant synchronous layout using backend BFS `depth` tiers, 100% semantic HTML/SVG, full React 19 & Tailwind CSS v4 integration, complete keyboard accessibility (WCAG AA), responsive mobile-adaptive mode. | Requires custom implementation of pan/zoom transform math and cubic bezier edge calculations. | **Optimal** — Backend `/assets/{id}/dependencies` already produces deterministic BFS `depth` (0=root, 1=bus/subsystem, 2=services, 3=zones), eliminating need for external layout heuristics. | **SELECTED FOR IMPLEMENTATION** |

---

## 3. Layout Algorithm & Architecture

### 3.1 Hierarchical Layered Positioning (Sugiyama Variant)
The backend's `traverse_asset_dependencies` service executes a breadth-first search from the root asset, annotating each node with an exact topological integer `depth`:
- **Depth 0 (Root)**: Selected equipment (e.g., `G-02` Generator)
- **Depth 1 (Direct Dependents / Distribution)**: Power buses, fuel conduits, primary pumps (e.g., `Power Bus A`, `Generator G-01`)
- **Depth 2 (Subsystems & Services)**: Functional systems consuming power/fluids (e.g., `HABITAT_HEATING_Z2`, `VENTILATION_LIVING`)
- **Depth 3 (Spatial Zones / Life Support)**: Living quarters, research bays (e.g., `ZONE-HABITAT-2`)

### 3.2 Coordinate Assignment Formula
Nodes are grouped by topological `depth` column:
- Horizontal Coordinate ($X_k$):
  $$X_k = \text{paddingLeft} + k \times \Delta X$$
  where $\Delta X \approx 280\text{px}$ accommodates full node card dimensions and edge clearance.
- Vertical Coordinate ($Y_{k, i}$):
  For each layer $k$ with $N_k$ nodes, vertical spacing centers the nodes around the canvas midpoint:
  $$Y_{k, i} = Y_{\text{center}} - \frac{(N_k - 1) \times \Delta Y}{2} + i \times \Delta Y$$
  where $\Delta Y \approx 120\text{px}$.

This ensures deterministic, aesthetic alignment with no edge crossings between adjacent single-parent nodes.

---

## 4. Edge Routing & Visual Semantics

### 4.1 Smooth Cubic Bezier Connectors
Edges between source $(X_s, Y_s)$ and target $(X_t, Y_t)$ are rendered as SVG smooth cubic bezier paths:
$$C(X_s, Y_s, X_s + \delta_x, Y_s, X_t - \delta_x, Y_t, X_t, Y_t)$$
where $\delta_x = \max(40, (X_t - X_s) \times 0.5)$.

### 4.2 Dependency Semantics & Color-Safe Styling
In compliance with Antarctic operational standards, dependency semantics are never conveyed by color alone:
- **ELECTRICAL**: Solid high-contrast line with electrical lightning badge (`⚡`), stroke width 2.5px.
- **THERMAL**: Dashed amber line with thermal badge (`🔥`), dasharray `6,4`.
- **HYDRAULIC**: Dotted cyan line with fluid badge (`💧`), dasharray `3,3`.
- **CONTROL**: Dash-dot purple line with telemetry badge (`📶`), dasharray `8,3,2,3`.
- **Redundancy**: Redundant pathways (`is_redundant: true`) are rendered with reduced opacity and dashed styling, distinguishing single points of failure from N+1 protected circuits.
- **Blast Radius Propagation**: When an upstream node is degraded (`WARNING` or `CRITICAL`), downstream active paths illuminate with high-visibility stroke highlighting and directional arrowhead markers.

---

## 5. Performance & Scalability

1. **DOM Virtualization Threshold**: Station sub-networks typically contain 5 to 30 nodes per asset blast radius. Vector SVG easily handles up to 500 nodes at 60 FPS without WebGL overhead.
2. **Transform Hardware Acceleration**: Pan and zoom utilize CSS `transform: translate3d(...) scale(...)` on an inner `<g>` or `<div>` wrapper, triggering GPU compositor layers with zero layout recalculation.
3. **Memoized Calculations**: Node positions and edge paths are memoized via `useMemo([dependencies])`, recalculating only when the backend response changes.

---

## 6. Accessibility & Operational Ergonomics

1. **Keyboard Traversal**: Every node is an interactive `<button>` with explicit `aria-label`, `aria-selected`, and `role="button"`. Pressing `Tab` cycles through nodes; `Enter` or `Space` selects and inspects.
2. **Screen Reader Live Region**: Node selection updates an `aria-live="polite"` region summarizing node name, status, criticality, and number of downstream dependencies.
3. **Contrast Compliance**: All text and badges adhere to WCAG 2.1 AAA contrast ratios (> 7:1) against both dark (`#0c1017`) and light station operational themes.
4. **Mobile Responsive Mode (< 768px)**: When viewed on narrow viewports (e.g., field tablet or handset 390x844), horizontal panning diagrams degrade readability. PolarOps provides an automatic adaptive layout:
   - Visual mini-graph with pinch/zoom controls.
   - Expandable Hierarchical Blast-Radius Cascade Tree with full tap-to-inspect cards, guaranteeing zero text truncation and zero horizontal overflow.
