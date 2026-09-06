---
name: browser-verification
description: Focused guidance for verifying user-visible frontend behavior using Playwright Test and Playwright MCP in PolarOps.
---

# Browser Verification Skill — Playwright-First Mandate

This skill defines the mandatory protocol for verifying user interface components, layouts, and operational journeys in PolarOps.

---

## 1. The Two Browser Verification Modes

In PolarOps, browser interaction is strictly bifurcated into two complementary roles:

| Tooling Layer | Package / Tool | Purpose | Authoritative For Pass/Fail? |
| :--- | :--- | :--- | :--- |
| **Playwright Test** | `@playwright/test` (`playwright.config.ts`) | Canonical automated regression suite, deterministic assertion testing, CI/local gates (`npm run test:e2e`). | **YES (Authoritative)** |
| **Playwright MCP** | `@playwright/mcp` (MCP Server `playwright`) | Interactive headed browser verification, visual exploration, element inspection, real-time page snapshots, and visual debugging. | **NO (Supplementary / Exploratory)** |

> [!IMPORTANT]
> **Manual or visual browser inspection alone is NOT sufficient evidence for a completed UI task.**
> Automated regression verification using **Playwright Test** (`npm run test:e2e`) remains mandatory for all completed UI tasks.

---

## 2. Playwright Test — Canonical Automated Verification

For all UI tasks:
1. **Run the relevant Playwright test(s)**: Execute `npm run test:e2e` (in `frontend/`).
2. **Perform actual user-visible verification**: Inspect user-visible results and assert expected headings, metrics, buttons, and state transitions.
3. **Record concrete pass/fail evidence**: Capture exact locator assertions, test execution time, and counts.
4. **Include test command and result in the completion report**: Report exact Playwright commands and exit status.

### Execution Commands
```bash
# In frontend/ directory:
npm run test:e2e            # Automated regression run against auto-managed backend & frontend
npm run test:e2e:ui         # Interactive Playwright UI mode for local step debugging
```

---

## 3. Playwright MCP — Interactive Headed Browser QA

The Antigravity environment exposes the official **`playwright`** MCP server (`@playwright/mcp`), running in headed mode by default.

### Primary Use Cases
- **Interactive Navigation & Exploration**: Open live pages (`browser_navigate`), inspect dynamic elements, and verify layouts before writing assertions.
- **Accessibility Snapshot Inspection**: Inspect the full semantic accessibility tree via `browser_snapshot`.
- **Targeted Element Interaction**: Click (`browser_click`), fill forms (`browser_fill_form`), and evaluate UI response states.
- **Visual Capture**: Capture viewport or full-page screenshots (`browser_take_screenshot`) to verify CSS styling, color schemes, and spatial hierarchy.

### Rules for Playwright MCP
- Use headed mode for interactive tasks so the operator/agent can view visual layout.
- Close browser tabs/contexts (`browser_close`) when exploratory inspection completes.
- Never substitute Playwright MCP manual inspection for passing automated Playwright Test specs.

---

## 4. Forbidden Verification Behaviors

Agents must **NOT**:
- Claim browser verification from TypeScript compilation (`tsc`) or Vite builds alone.
- Treat manual browser inspection or MCP screenshots alone as a passing test without Playwright Test execution.
- Build disposable custom browser automation scripts (e.g. ad-hoc puppeteer scripts or temporary selenium hacks) as a substitute for Playwright.
- Silently substitute another testing framework (e.g. Cypress, WebdriverIO).

---

## 5. Tooling Failure Protocol

If Playwright infrastructure genuinely cannot run due to an unresolvable environment or tooling blocker:
- The agent must **report the blocker explicitly** in the completion report.
- The agent must **NOT** silently mark the task as verified or substitute an unapproved tool.

---

## 6. Verification Reporting Standard

In the final task response, always include a dedicated **Browser Verification** section adhering to this format:

```markdown
## Browser Verification
- Playwright Test executed: YES/NO
- Playwright Test result: X passed / Y total (`npm run test:e2e`)
- Playwright MCP interactive inspection: YES/NO (e.g. verified headed navigation, visual layout, interactive clicks)
- Visual/Interactive Result: Summary of visual elements, state transitions, and responsive behavior confirmed.
```
