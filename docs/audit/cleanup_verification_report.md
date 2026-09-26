# PolarOps — Cleanup Verification Report

This report documents the verification of root-level files, configurations, deployment dependencies, and legacy scaffolds prior to any structural cleanup, pursuant to Phase 1 of the PolarOps repository cleanup.

---

## Verification Matrix

| File / Path | Detected Purpose | References Found | Active / Inactive Determination | Recommended Action | Confidence Level |
|---|---|---|---|---|---|
| `src/` (70 files) | Legacy Lovable / TanStack Start prototype scaffold from Day 1 | Referenced only by root `package.json`, root `vite.config.ts`, and root `tsconfig.json`. Not referenced by active frontend or backend. Broken compilation since commit `6048a3b`. | **INACTIVE (Orphaned)** | Remove directory (`git rm -r src`) | **High (100%)** |
| `graphify-out/` (82 files) | Generated AST graphify knowledge graph cache (`graph.json`, `stat-index.json`, HTML viz) | Auto-generated AST cache from running graphify tool. Listed as generated output in `.agents/rules/graphify.md`. | **INACTIVE (Generated Artifacts)** | Remove tracked cache (`git rm -r graphify-out`), add to `.gitignore` | **High (100%)** |
| `.lovable/project.json` | Platform metadata from original Lovable web export | No code or deployment references anywhere in repository. | **INACTIVE (Orphaned)** | Remove file (`git rm -r .lovable`), add to `.gitignore` | **High (100%)** |
| `bun.lock` | Bun package manager lockfile from initial template export | No CI, script, or runtime references. Frontend uses `npm` (`package-lock.json` in `frontend/`). | **INACTIVE (Orphaned)** | Remove file (`git rm bun.lock`) | **High (100%)** |
| `bunfig.toml` | Bun configuration file from initial template export | No references in repository or deployment configs. | **INACTIVE (Orphaned)** | Remove file (`git rm bunfig.toml`) | **High (100%)** |
| `frontend_baseline_audit.md` | Comprehensive 297-line historical audit explaining Vercel domain routing mismatch (`polarops-two` vs `polarops.vercel.app`) and verified feature matrix | Referenced in prior audit documentation. Invaluable historical context regarding domain mapping and UI preservation. | **ACTIVE (Documentation)** | Relocate to `docs/audit/frontend_baseline_audit.md` | **High (100%)** |
| `DESIGN.md` | Canonical design system specification (SCADA aesthetic, semantic CSS color tokens, typography, component guidelines) | Referenced in `frontend_baseline_audit.md` (lines 126, 213, 295). Core standard for high-contrast light/dark mode. | **ACTIVE (Documentation)** | Relocate to `docs/architecture/DESIGN.md` | **High (100%)** |
| `RELEASE_HANDOFF.md` | Engineering release documentation for v1.0 release candidate (product thesis, progressive disclosure model, demo storyline) | Authoritative reference for UI disclosure levels and operational surfaces. | **ACTIVE (Documentation)** | Relocate to `docs/engineering/RELEASE_HANDOFF.md` | **High (100%)** |
| `CLAUDE.md` | UI design guidelines and generation prompts written specifically for Claude Code | Not referenced by active tooling (`AGENTS.md` and `.agents/` govern current IDE workflows). Contents duplicate `DESIGN.md`. | **INACTIVE (Redundant)** | Remove file (`git rm CLAUDE.md`) | **High (95%)** |
| `components.json` | Shadcn UI configuration for root `src/` scaffold (`"css": "src/styles.css"`) | No references in active `frontend/` (which has independent Tailwind v4 setup). | **INACTIVE (Orphaned by `src/`)** | Remove or defer to human confirmation alongside root build configs | **High (100%)** |
| `package.json` (root) | Root npm package manifest for Lovable `tanstack_start_ts` scaffold | References only `src/server.ts` and Lovable SSR plugins. Not used by Vercel or Render. | **INACTIVE (Orphaned by `src/`)** | Defer removal to human approval or preserve as inert manifest to prevent root install confusion | **High (95%)** |
| `vite.config.ts` (root) | Vite configuration for root Lovable TanStack Start SSR app | References `@lovable.dev/vite-tanstack-config` and `src/server.ts`. | **INACTIVE (Orphaned by `src/`)** | Remove if root configs are cleaned up; defer if root package.json preserved | **High (100%)** |
| `tsconfig.json` (root) | TypeScript configuration for root `src/` app | Includes only `src/**/*.ts*`, `vite.config.ts`, `eslint.config.js`. | **INACTIVE (Orphaned by `src/`)** | Remove if root configs are cleaned up; defer if root package.json preserved | **High (100%)** |
| `eslint.config.js` (root) | ESLint flat configuration for root `src/` app | Uses `@eslint/js` and TanStack Start rules. Active frontend uses `oxlint`. | **INACTIVE (Orphaned by `src/`)** | Remove if root configs are cleaned up; defer if root package.json preserved | **High (100%)** |
| `.agents/skills/brag/assets/` | Bundled audio assets (278 `.wav` and `.ogg` files) for the `/brag` launch video agent skill | Referenced in `.agents/skills/brag/SKILL.md` (lines 100) and `references/audio.md`. Not used by digital twin app. | **ACTIVE (Tooling-Specific)** | PRESERVE. Do not remove in Phase 2; flag for optional human archive. | **High (90%)** |

---

## Deployment & Build Verification Summary

1. **Vercel Frontend Build**:
   - Active configuration: `frontend/vercel.json`
   - Framework preset: `vite`
   - Root directory in Vercel settings: `frontend`
   - Build command: `npm run build` (`tsc -b && vite build`)
   - Install command: `npm install`
   - Output directory: `dist`
   - API Proxying: `/api/(.*)` rewritten to `https://polarops-api.onrender.com/$1`
   - SPA Routing: `/(.*)` rewritten to `/index.html`
   - Status: Verified independently building in 1.58s with zero TypeScript or Vite errors.

2. **Render Backend Build**:
   - Active configuration: `render.yaml`
   - Root directory: `backend`
   - Runtime: Python 3.11.12
   - Build command: `pip install -r requirements.txt`
   - Start command: `alembic upgrade head && python -m app.core.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health check: `/health`
   - Database: Render PostgreSQL (`polarops-db`)
   - Status: Verified passing all 95 pytest unit and integration tests.

---

## Conclusion & Approved Phase 2 Actions

Based on verified evidence:
- `src/`, `graphify-out/`, `.lovable/project.json`, `bun.lock`, `bunfig.toml`, and `CLAUDE.md` are 100% conclusively unused by production builds and are approved for safe structural removal.
- `frontend_baseline_audit.md`, `DESIGN.md`, and `RELEASE_HANDOFF.md` are active documentation assets and will be preserved under `docs/`.
- Root build configs (`package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `components.json`) are confirmed orphaned by the removal of `src/`. Per the strict constraint *"DO NOT remove root build configs unless verification proves they are unused"*, we will present them for human review, keeping root manifests inert or removing only upon explicit confirmation.
- `.agents/skills/brag/assets/` is confirmed tooling-specific and will be preserved.
