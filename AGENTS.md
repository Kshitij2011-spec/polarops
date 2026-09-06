# AGENTS.md — Repository Operating Rules & Guidelines

## 1. Repository-Wide Workflow
Every agent operating in this repository MUST follow this sequence:
1. Read `AGENTS.md`.
2. Identify the current task in `tasks/CURRENT_TASK.md`.
3. Read ONLY relevant project documents (2–4 max) and the relevant skill from `.agents/skills/`.
4. Inspect existing code, schemas, and tests before making changes.
5. Plan the smallest coherent change.
6. Implement with strict scope discipline.
7. Run unit and API tests.
8. Verify user-visible behavior in the browser for all UI changes.
9. Update relevant documentation if schemas or contracts changed.
10. Converge implementation against acceptance criteria using `tasks/CONVERGENCE_TEMPLATE.md`.
11. Output the standard agent report.

---

## 2. Context Locality & Token Economy
- **Do NOT Load the Entire Repository**: Never dump all documentation into a task context.
- **Context Locality Package**:
  - `AGENTS.md` (Operating rules)
  - `tasks/CURRENT_TASK.md` (Current bounded task)
  - `2–4 relevant project documents` (e.g. `API_CONTRACTS.md` + `DATA_MODEL.md`)
  - `1 relevant skill` from `.agents/skills/`
- **Source of Truth**: Never duplicate large blocks of requirements into task files. Reference authoritative documents instead.

---

## 3. Implementation Rules
- **Domain Logic Ownership**: Backend (FastAPI/Python) owns calculations, risk scoring, dependency BFS traversal, and scenario simulations. Frontend (React) owns presentation and UI interaction.
- **Data Honesty**: Always include telemetry provenance metadata (`source`, `timestamp`, `freshness`, `quality`, `truth_type`, `confidence`). Never present synthetic test data as live NCPOR telemetry feeds.
- **Explicit Types & Validation**: Use TypeScript on frontend and Pydantic v2 schemas on backend.
- **Zero Unnecessary Infrastructure**: Do not introduce Kafka, Neo4j, Redis, or microservices without explicit instruction.
- **Preserve Working Features**: Never break existing functional code, routes, or build setups.

---

## 4. Standard Implementation Task Format
```text
Task: [Task Title]
Context: [1-2 sentences on why this task exists]
Objective: [Clear outcome]
Relevant Docs: [Clickable links to PRD, ARCHITECTURE, API_CONTRACTS, etc.]
In Scope: [Explicit boundary list]
Out of Scope: [Forbidden extensions]
Implementation Requirements: [Specific technical instructions]
Acceptance Criteria: [Verifiable pass criteria]
Verification: [Commands/tests to execute]
Stop Condition: [When to return]
```

---

## 5. Standard Agent Reporting Output Format
Every completed task MUST conclude with this exact structure:

```markdown
## Completed
- Bulleted summary of accomplished objectives.

## Files Changed
- [file basename](file:///path/to/file) - Description of change.

## Verification
- Unit/API test commands executed and results.

## Browser Verification
- Visual inspection steps, route tested, and interactive results.

## Known Limitations
- Any technical trade-offs or out-of-scope follow-ups.

## Documentation Updated
- Any updated schemas, contracts, or roadmap items.

## Convergence Status
- CONVERGED (all acceptance criteria met) or NEEDS FIX.

## Recommended Next Task
- Exact next milestone or task ID.
```
## Browser Verification — Mandatory

For UI work:
1. Use Playwright Test (`npm run test:e2e`) for deterministic automated verification.
2. Use Playwright MCP (`@playwright/mcp`) for interactive visual/browser inspection where useful.
3. Do not substitute manual browser inspection for automated E2E verification.
4. Do not create custom browser-testing infrastructure.

If Playwright infrastructure is unavailable, the agent must report the blocker rather than silently substituting an unrelated testing method.