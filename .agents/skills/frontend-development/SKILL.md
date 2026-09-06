---
name: frontend-development
description: Focused guidance for React, TypeScript, Tailwind CSS, Lucide icons, and shadcn/ui UI development in PolarOps.
---

# Frontend Development Skill

This skill provides focused standards and implementation rules for building user interface components and layouts in PolarOps.

---

## 1. Responsibilities & Scope
- **Component Development**: Building modular, reusable, accessible React components.
- **Layout & Composition**: Designing responsive, high-aesthetic polar operational views (Command Center, Asset Detail, Graph Views).
- **Type Safety**: Defining explicit TypeScript interfaces in `types/` reflecting [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md).
- **Server-State Consumption**: Utilizing TanStack Query hooks for caching, background refetching, and error handling.
- **UI State**: Managing localized view states cleanly with React hooks / lightweight state without bloat.
- **Visual Design System**: Adhering to dark-mode polar aesthetics using Tailwind CSS, Lucide icons, and shadcn/ui primitives.

---

## 2. Core Implementation Rules
1. **Zero Domain Logic in Presentational Components**:
   - UI components must never perform risk calculations, dependency graph traversals, or fuel burn forecasts.
   - All domain calculations belong in backend FastAPI domain services.
2. **Reuse Existing Primitives**:
   - Reuse shared design tokens, badges, and status widgets rather than duplicating CSS or layout logic.
3. **Semantic HTML & Accessibility**:
   - Use semantic tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`). Ensure buttons have descriptive accessible labels and interactive elements carry unique testable IDs.
4. **Resilient UI States**:
   - Every view component consuming data MUST explicitly handle four states: `Loading` (skeleton/spinner), `Error` (actionable message), `Empty` (clean zero-state banner), and `Stale/Degraded` (provenance warning tag).
5. **No Schema Drift**:
   - Never invent ad-hoc client-side JSON shapes. Always match schemas documented in [API_CONTRACTS.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/architecture/API_CONTRACTS.md).
6. **No Speculative UI Dependencies**:
   - Do not install heavy graph or 3D visual libraries unless explicitly instructed by the current task specification.

---

## 3. Required Verification for UI Tasks
Before declaring any frontend task complete:
1. **Type Check**: Run `npx tsc --noEmit` (zero TypeScript errors allowed).
2. **Build Check**: Run `npm run build` (bundle compiles cleanly).
3. **Browser Verification**: Use the `browser-verification` skill to visually inspect the component in a real browser session.
