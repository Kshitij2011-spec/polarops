# PolarOps — Design System Specification

This document is the visual source of truth for the PolarOps frontend.
All components, pages, and themes must conform to these rules.

---

## 1. Brand & Visual Direction

**PolarOps** is an operational digital twin for Antarctic research stations.

The visual language communicates:
- **Precision** — every element serves a purpose
- **Calm authority** — operators make critical decisions under stress; the interface must not add visual noise
- **Scientific credibility** — institutional, not startup
- **Environmental seriousness** — manages infrastructure in Earth's most hostile environment
- **Operational clarity** — most important information must be immediately scannable

### Visual references (principles, not clones)
- Industrial control systems (SCADA HMI panels)
- Scientific instrument software (observatory, telemetry dashboards)
- Aviation weather briefing tools
- Government infrastructure monitoring (NOAA, ESA ground stations)

### What PolarOps is NOT
- A SaaS marketing dashboard
- A cyberpunk terminal
- A military HUD
- A generic AI-generated dark-mode app
- A glassmorphism showcase

---

## 2. Semantic Color Token System

Colors are defined as CSS custom properties on `:root` (light) and `.dark` (dark).
Components must NEVER use hardcoded Tailwind color classes directly.
Instead, use semantic tokens via CSS variables consumed through Tailwind's theme system.

### Token Roles

| Token | Purpose |
|-------|---------|
| `--bg-primary` | Main page background |
| `--bg-secondary` | Elevated surfaces (cards, panels) |
| `--bg-tertiary` | Recessed/muted areas (inputs, code) |
| `--bg-elevated` | Popovers, dropdowns, dialogs |
| `--fg-primary` | Primary text |
| `--fg-secondary` | Secondary/supporting text |
| `--fg-muted` | Subtle text (timestamps, labels) |
| `--fg-inverse` | Text on colored backgrounds |
| `--border-default` | Default borders |
| `--border-subtle` | Subtle dividers |
| `--border-strong` | Emphasized borders (active states) |
| `--accent` | Primary brand accent |
| `--accent-fg` | Text on accent background |
| `--status-nominal` | Healthy / OK / Online |
| `--status-nominal-bg` | Background for nominal status |
| `--status-warning` | Degraded / Attention |
| `--status-warning-bg` | Background for warning status |
| `--status-critical` | Critical / Emergency / Offline |
| `--status-critical-bg` | Background for critical status |
| `--status-info` | Informational / Derived |
| `--status-info-bg` | Background for info status |

---

## 3. Light Theme Palette

Institutional, clean, scientific, premium.

| Token | Value | Note |
|-------|-------|------|
| `--bg-primary` | `#f8f9fb` | Warm off-white |
| `--bg-secondary` | `#ffffff` | Card surfaces |
| `--bg-tertiary` | `#f0f2f5` | Recessed areas |
| `--bg-elevated` | `#ffffff` | Popovers |
| `--fg-primary` | `#1a1d23` | Near-black |
| `--fg-secondary` | `#4a5060` | Medium gray |
| `--fg-muted` | `#7a8194` | Subtle text |
| `--border-default` | `#d8dce6` | Calm border |
| `--border-subtle` | `#e8ecf2` | Subtle dividers |
| `--border-strong` | `#b0b8c8` | Active states |
| `--accent` | `#2563a8` | Deep institutional blue |
| `--accent-fg` | `#ffffff` | White on blue |
| `--status-nominal` | `#16804a` | Green |
| `--status-nominal-bg` | `#ecfdf5` | Light green |
| `--status-warning` | `#b45309` | Amber |
| `--status-warning-bg` | `#fffbeb` | Light amber |
| `--status-critical` | `#c4342d` | Red |
| `--status-critical-bg` | `#fef2f2` | Light red |
| `--status-info` | `#2563a8` | Blue |
| `--status-info-bg` | `#eff6ff` | Light blue |

---

## 4. Dark Theme Palette

Precise, operational, restrained, legible.

| Token | Value | Note |
|-------|-------|------|
| `--bg-primary` | `#0f1117` | Deep charcoal |
| `--bg-secondary` | `#181b24` | Card surfaces |
| `--bg-tertiary` | `#1e2230` | Recessed areas |
| `--bg-elevated` | `#242838` | Popovers |
| `--fg-primary` | `#e4e8f0` | Light text |
| `--fg-secondary` | `#9ca3b4` | Medium gray |
| `--fg-muted` | `#6b7280` | Subtle text |
| `--border-default` | `#2a2f3e` | Restrained |
| `--border-subtle` | `#1f2433` | Subtle dividers |
| `--border-strong` | `#3d4556` | Active states |
| `--accent` | `#5b9cf5` | Blue on dark |
| `--accent-fg` | `#0f1117` | Dark on blue |
| `--status-nominal` | `#34d399` | Green |
| `--status-nominal-bg` | `#0a2e1f` | Dark green |
| `--status-warning` | `#fbbf24` | Amber |
| `--status-warning-bg` | `#2a2008` | Dark amber |
| `--status-critical` | `#f87171` | Red |
| `--status-critical-bg` | `#2a0f0f` | Dark red |
| `--status-info` | `#5b9cf5` | Blue |
| `--status-info-bg` | `#0f1a2e` | Dark blue |

---

## 5. Typography

### Font Stack
- **Headings and body**: `"Inter", ui-sans-serif, system-ui, sans-serif`
- **Telemetry values and codes**: `"JetBrains Mono", "Fira Code", ui-monospace, monospace`

JetBrains Mono is used ONLY for: metric values, asset IDs, status labels, timestamps, codes.
Body text, descriptions, and explanations always use Inter.

### Type Scale
| Size | px/line | Usage |
|------|---------|-------|
| `text-xs` | 12/16 | Labels, metadata, timestamps |
| `text-sm` | 14/20 | Body text, descriptions |
| `text-base` | 16/24 | Default body |
| `text-lg` | 18/28 | Section headings |
| `text-xl` | 20/28 | Page section titles |
| `text-2xl` | 24/32 | Key metrics |
| `text-3xl` | 30/36 | Hero metric (station health) |

---

## 6. Spacing, Borders, Shadows

### Spacing: 4px base unit, Tailwind default scale.
### Borders: `rounded-md` (6px) default, `rounded` (4px) badges, `rounded-full` dots only.
### Shadows: Sparingly. `shadow-none` default, `shadow-sm` dropdowns, `shadow-md` dialogs.

---

## 7. Status Semantics

| Status | Color | Usage |
|--------|-------|-------|
| NOMINAL | Green | Healthy, online, within limits |
| WARNING | Amber | Degraded, approaching limits |
| CRITICAL | Red | Emergency, offline, limit exceeded |
| INFO | Blue | Derived, informational |

Status always includes color AND text label.

---

## 8. Component Rules

### Buttons
- Primary: accent bg. One per section max.
- Secondary: transparent + border.
- Destructive: red-tinted, visually distinct.
- Labels describe actions: "Inspect Asset" not "Explore".

### Cards
- bg-secondary + border-default + p-4 + rounded-md. No shadow.
- Never nested more than 1 level.
- No gradients, no glassmorphism.

### Tables
- No rounded rows. Strong column alignment.
- Numeric columns: right-aligned, monospace.
- Hover state on rows.

### Forms
- bg-tertiary inputs. Labels above. Focus ring visible.

---

## 9. Accessibility

- WCAG 2.1 AA contrast minimum
- All interactive elements keyboard-accessible
- Visible focus indicators
- Semantic HTML
- Form labels required
- Icon buttons need aria-label
- `prefers-reduced-motion` respected
- `prefers-color-scheme` for default theme

---

## 10. Anti-Patterns (NEVER USE)

- Purple/rainbow gradients
- Glassmorphism
- Gradient text
- Giant hero sections
- Particle effects
- Fake metrics/counters
- AI branding
- Emoji as icons
- Neon glowing borders
- More than 2 card nesting levels
- Color as only status differentiator
