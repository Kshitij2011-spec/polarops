## Description
<!-- Provide a concise explanation of what this PR introduces or resolves. -->

## Linked Task / Issue
<!-- Reference the relevant task file or issue (e.g. tasks/CURRENT_TASK.md or #issue) -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds operational capability)
- [ ] Refactoring / Cleanup (code reorganization with zero behavioral change)
- [ ] Documentation update
- [ ] CI / Tooling configuration

## Architecture & Boundary Compliance
- [ ] Domain logic ownership: calculations, risk scoring, BFS graph traversals, and simulations reside in FastAPI backend.
- [ ] Presentation ownership: UI rendering, state management, and user interaction reside in React frontend.
- [ ] Telemetry provenance: all telemetry metrics include source, timestamp, freshness, quality, and truth metadata.
- [ ] Zero unapproved infrastructure: no unrequested external datastores or message brokers introduced.

## Verification Checklist
### Backend (if applicable)
- [ ] `cd backend && pytest` passes all tests.
- [ ] New API endpoints or schema modifications are documented in `docs/architecture/API_CONTRACTS.md`.

### Frontend (if applicable)
- [ ] `cd frontend && npm run lint` passes without errors.
- [ ] `cd frontend && npm run build` compiles with zero errors.
- [ ] UI changes visually verified in the browser (attach screenshot below if applicable).

## Screenshots / Evidence (if UI changed)
<!-- Attach 1440x900 desktop / responsive screenshots or test logs if applicable -->
