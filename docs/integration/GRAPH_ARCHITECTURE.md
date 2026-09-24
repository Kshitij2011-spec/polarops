# PolarOps Graph Architecture Specification

## 1. Executive Summary
This document specifies the architecture, evaluation criteria, and implementation plan for PolarOps' dependency graph and blast-radius visualization.

The dependency graph is a core operational capability of the PolarOps Digital Twin:
It connects:
`ASSET (e.g. G-02)` → `SUBSYSTEM (Power Generation)` → `ELECTRICAL/THERMAL DEPENDENCY (Power Bus A)` → `DOWNSTREAM SERVICE (Life Support / Science)` → `HABITAT IMPACT (+20°C Thermal Margin)`

---

## 2. Library Evaluation & Trade-off Analysis

| Criterion | `@xyflow/react` (React Flow) | `Cytoscape.js` | Custom SVG Canvas |
|---|---|---|---|
| **React 19 Compatibility** | Native React component model | Imperative canvas wrapper required | Native React SVG |
| **Node Customization** | Full JSX/HTML nodes (badges, telemetry, sparklines) | Canvas-rendered shapes (limited styling) | Full JSX, but manual coordinate math |
| **Automatic Layout** | Plug-in with `dagre` / `elkjs` | Built-in (CoSE, Breadthfirst, Dagre) | Manual / Hardcoded layout |
| **Edge Routing** | Smooth step, bezier, orthogonal out of the box | Built-in bezier, taxi routing | Manual SVG cubic beziers |
| **Zoom / Pan / Fit** | Built-in smooth viewport controls & minimap | Built-in viewport controls | Manual wheel/drag event handlers |
| **Blast-Radius Highlighting** | Dynamic node/edge styling via React state | Element class selectors (`ele.addClass`) | CSS class toggle on elements |
| **Bundle Impact** | Moderate (~80 KB gzip) | Moderate (~90 KB gzip) | Minimal (~5 KB gzip) |
| **Maintenance & Ecosystem** | Actively maintained by xyflow team | Actively maintained, academic focus | Self-maintained |
| **Accessibility (a11y)** | Keyboard navigable nodes, ARIA attributes | Difficult canvas screen-reader parsing | Standard SVG DOM nodes |

### Decision: `@xyflow/react` + `dagre`
- **Rationale**: React Flow (`@xyflow/react`) allows every twin node to be a full, styled React component that renders live operational badges, status dots, and telemetry values directly within the node body. Its edge routing handles hierarchical directed acyclic graphs (DAGs) naturally when combined with `dagre` for deterministic hierarchical layering (Generators → Buses → Subsystems → Habitats).
- **Backend Data Source**: FastAPI `/assets/{id}/dependencies?max_depth=5` provides authoritative BFS-traversed nodes and edges with `dependency_type` (`ELECTRICAL`, `THERMAL`, `HYDRAULIC`, `CONTROL`) and `criticality`.

---

## 3. Node & Edge Operational Model

### Node Model
```typescript
export interface DependencyNodeData {
  id: string;
  name: string;
  subsystem: string;
  status: "NOMINAL" | "WARNING" | "CRITICAL" | "OFFLINE";
  criticality: "MISSION_CRITICAL" | "OPERATIONAL" | "SECONDARY";
  currentLoadKw?: number;
  temperatureCelsius?: number;
  isInspected: boolean;
  isInBlastRadius: boolean;
}
```

### Edge Model
```typescript
export interface DependencyEdgeData {
  source: string;
  target: string;
  dependencyType: "ELECTRICAL" | "THERMAL" | "HYDRAULIC" | "CONTROL";
  criticality: "CRITICAL" | "NON_CRITICAL";
  activeFlow: boolean;
  blastRadiusPropagation: boolean;
}
```

---

## 4. Blast Radius & Traversal Interaction
When an operator clicks node `G-02`:
1. **Focus**: The graph centers smoothly on G-02.
2. **Upstream Trace**: Edges and nodes supplying fuel, cooling, and control to G-02 are highlighted in blue.
3. **Downstream Blast Radius**: Downstream nodes directly or indirectly dependent on G-02 (e.g. Power Bus A, Habitat HVAC, Deep-Space Science Radar) are illuminated with amber/red glow based on degraded capacity.
4. **Context Drawer Integration**: Triggers the 5-step explainability drawer:
   - What happened?
   - Why does it matter?
   - What depends on it?
   - What could happen next?
   - What should the operator review?
