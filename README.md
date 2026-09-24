# PolarOps Command

Build a complete frontend prototype for:

POLAROPS — ANTARCTIC OPERATIONAL DIGITAL TWIN (AODT)

This is a Smart India Hackathon 2026 project.

IMPORTANT:

This is a FRONTEND PROTOTYPE.

Do not wait for or request a backend.

Do not ask for API URLs, API keys, CORS, authentication, StationOverview types, or backend documentation.

Use a centralized LOCAL DEMO DATA layer.

The prototype must be fully functional visually and interactively using local React state.

Do not merely describe the UI.

ACTUALLY BUILD THE APPLICATION AND UPDATE THE PREVIEW.

==================================================

PRODUCT CONCEPT

==================================================

PolarOps is an Antarctic operational decision-support platform.

Its core workflow is:

DATA

→ CONTEXT

→ IMPACT

→ PREDICTION

→ DECISION

→ HUMAN REVIEW

→ ACTION

PolarOps is NOT autonomous control.

Human approval remains part of the operational workflow.

The interface should feel like:

ANTARCTIC EXPEDITION MISSION CONTROL

+

DIGITAL TWIN

+

OPERATIONAL DECISION SUPPORT

It must NOT look like a generic SaaS admin dashboard.

==================================================

TECH STACK

==================================================

Use:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

Lucide React

Use clean reusable components.

Keep demo data centralized so it can later be replaced by a real API.

==================================================

VISUAL DESIGN

==================================================

Overall style:

- premium

- technical

- calm

- Antarctic

- operational

- information-dense but clean

- strong visual hierarchy

- minimal decoration

- professional mission-control aesthetic

LIGHT THEME:

Background:

#F7FAFC

Surface:

#FFFFFF

Secondary:

#F1F5F9

Primary text:

#172554

Secondary text:

#475569

Borders:

#CBD5E1

Technical cyan:

#369ACC

Digital Twin violet:

#6D5BD0

Warning:

#F4895F

Critical:

#DE324C

Success:

#4FAE7A

DARK THEME:

Background:

#0B1120

Surface:

#111827

Secondary:

#172033

Elevated:

#1E293B

Primary text:

#F8FAFC

Secondary text:

#CBD5E1

Muted:

#94A3B8

Borders:

#334155

Technical cyan:

#46B9C7

Digital Twin violet:

#8B7CE8

Warning:

#F4895F

Critical:

#DE324C

Success:

#4FAE7A

Do NOT simply invert the light theme.

Dark mode should feel like Antarctic night operations.

==================================================

GLOBAL THEME

==================================================

Create a functional application-wide Light/Dark toggle.

Place it in the top-right command bar.

Use:

Sun icon

Moon icon

Persist the selected theme using localStorage.

Respect system preference on first visit when possible.

Both themes must be fully designed.

==================================================

APPLICATION SHELL

==================================================

Create a 230–250px desktop sidebar.

BRAND:

POLAROPS

Antarctic Digital Twin

COMMAND

Overview

Digital Twin

Stations

OPERATIONS

Resources

Scenarios

Resilience

Alerts

REPORTING

Reports

SYSTEM

Settings

Use Lucide icons.

Active navigation should have a subtle cyan/blue background and clear active indicator.

Use the same shell across all screens.

==================================================

TOP COMMAND BAR

==================================================

Show:

STATION

BHARATI

STATE

WINTER

CONNECTIVITY

CONNECTED

SYNC

SYNCHRONIZED

TIME

14:32:08 UTC

Theme toggle

User/system icon

Mark operational demo information clearly as:

DEMO DATA

==================================================

OVERVIEW / COMMAND CENTER

==================================================

Header:

STATION BHARATI · WINTER OPERATIONS

Operational Command Center

Subtitle:

Common operational picture for station infrastructure,

environment, personnel and logistics.

Status:

OPERATIONAL

--------------------------------------------------

OPERATIONAL METRICS

--------------------------------------------------

Create a 2×2 grid.

POWER

1,240 kW

Generation and distribution

NOMINAL

MEASURED · DEMO

FUEL

68%

Diesel storage capacity

WARNING

MEASURED · DEMO

PERSONNEL

52

Station complement

NOMINAL

MEASURED · DEMO

TEMPERATURE

−21.4 °C

External environmental conditions

NOMINAL

MEASURED · DEMO

Use clean mission-control metric cards.

--------------------------------------------------

STATION DIGITAL TWIN

--------------------------------------------------

Create a large visual centerpiece:

STATION DIGITAL TWIN

Subtitle:

Operational topology and dependency state

Nodes:

POWER PLANT

3 generators

COMMS MAST

SATCOM

HABITAT

52 occupants

SCIENCE LAB

4 experiments

FUEL FARM

68% capacity

LOGISTICS BAY

Traverse T-12

WATER & WASTE

74% capacity

Connect nodes with dependency lines.

Show:

NOMINAL

WARNING

CRITICAL

DEPENDENCY

Use subtle grid background.

Make it look like a DIGITAL TWIN, not a simple flowchart.

Label:

DEMO OPERATIONAL MODEL

Nodes should be clickable.

--------------------------------------------------

G-02 CRITICAL EVENT

--------------------------------------------------

Create:

CRITICAL OPERATIONAL EVENT

DIESEL GENERATOR G-02

Status:

CRITICAL

Demo telemetry:

Bearing vibration

+3.1% deviation

Power contribution

42%

Dependency

Power Bus A

Warning threshold

+2.5%

Label:

ILLUSTRATIVE DEMO TELEMETRY

Buttons:

INSPECT G-02

VIEW DEPENDENCIES

OPEN EXPLANATION

--------------------------------------------------

G-02 ASSET INTELLIGENCE

--------------------------------------------------

Create:

G-02 · ASSET INTELLIGENCE

CURRENT CONDITION

Power output

520 kW

Vibration

+3.1%

Temperature

74°C

Runtime

4,821 h

Fuel flow

82 L/h

Clearly mark:

ILLUSTRATIVE DEMO TELEMETRY

Include a visual vibration indicator.

--------------------------------------------------

INCIDENT TIMELINE

--------------------------------------------------

Create:

INCIDENT TIMELINE

14:22:07

Anomaly detected

14:22:31

Operating context evaluated

14:23:04

Power dependency identified

14:23:28

Impact scenario generated

14:24:10

Operational recommendation created

14:24:42

Human review required

Visually connect the timeline.

--------------------------------------------------

CAUSAL REASONING

--------------------------------------------------

Create:

CAUSAL REASONING

Show:

01 EVENT

G-02 vibration deviation

02 CONTEXT

Generator operating conditions

03 IMPACT

Reduced power redundancy

04 FUTURE

Potential escalation

05 DECISION

Inspect G-02 and verify redundancy

06 OUTCOME

Awaiting operator approval

Label:

ILLUSTRATIVE DECISION TRACE

Make it expandable/collapsible.

--------------------------------------------------

DEPENDENCY MODEL

--------------------------------------------------

Create:

OPERATIONAL DEPENDENCY MODEL

G-02

→ POWER BUS A

→ HABITAT

G-02

→ POWER BUS A

→ SCIENCE LAB

G-02

→ POWER SYSTEM

→ FUEL SYSTEM

Differentiate:

ASSET

SUBSYSTEM

OPERATION

--------------------------------------------------

RECOMMENDATION

--------------------------------------------------

Create:

OPERATIONAL RECOMMENDATION

Recommended action:

Inspect G-02 operating condition and verify backup generation capacity before further load escalation.

Rationale:

Observed deviation may affect available power redundancy under current operating conditions.

Confidence:

DEMO · 87%

Provenance:

ILLUSTRATIVE REASONING

Buttons:

REVIEW DECISION

VIEW SCENARIO

--------------------------------------------------

HUMAN-IN-THE-LOOP

--------------------------------------------------

Create:

HUMAN-IN-THE-LOOP CONTROL

DETECTION

→

ANALYSIS

→

RECOMMENDATION

→

HUMAN REVIEW

→

APPROVAL

→

ACTION

Highlight HUMAN REVIEW.

Text:

PolarOps provides decision support.

Operational actions require human approval.

--------------------------------------------------

OPERATIONAL ACTIVITY

--------------------------------------------------

Create:

OPERATIONAL ACTIVITY

14:22

Generator G-02 anomaly detected

WARNING

13:58

SATCOM communication window opened

NOMINAL

13:30

Fuel transfer completed

NOMINAL

12:48

Science telemetry synchronized

NOMINAL

Label:

DEMO ACTIVITY

==================================================

DIGITAL TWIN PAGE

==================================================

Create a dedicated Digital Twin screen.

Large interactive topology.

Clicking a node opens an asset information panel.

Show:

Asset

System

Status

Dependencies

Impact

Last update

Add:

ZOOM IN

ZOOM OUT

RESET VIEW

Clicking a node highlights its dependency path.

==================================================

STATIONS PAGE

==================================================

Create:

STATION PORTFOLIO

BHARATI

MAITRI

Each card:

Operational state

Connectivity

Personnel

Power state

Alert count

Use demo data.

Clicking a station opens its overview.

==================================================

RESOURCES PAGE

==================================================

Create:

RESOURCE & LOGISTICS

FUEL

POWER

WATER

FOOD

MEDICAL

LOGISTICS

Each resource:

Current level

Status

Consumption

Reserve

Last update

Use clean visual indicators.

==================================================

SCENARIOS PAGE

==================================================

Create:

SCENARIO SIMULATION

Scenarios:

GENERATOR FAILURE

FUEL SHORTAGE

COMMUNICATION LOSS

SEVERE WEATHER

SUPPLY DELAY

Each contains:

Description

Affected systems

Risk level

Button:

RUN SCENARIO

Clicking it produces a local simulated result:

Operational impact

Affected dependencies

Resource impact

Recommended mitigation

Label:

SIMULATED RESULT · DEMO

==================================================

RESILIENCE PAGE

==================================================

Create:

STATION RESILIENCE

POWER REDUNDANCY

FUEL AUTONOMY

COMMUNICATIONS

LIFE SUPPORT

LOGISTICS

DATA SYNCHRONIZATION

Statuses:

NOMINAL

WATCH

ATTENTION

Use descriptive indicators.

Do not create an arbitrary AI score.

==================================================

ALERTS PAGE

==================================================

Create:

OPERATIONAL ALERTS

CRITICAL

G-02 generator vibration exceeds threshold

WARNING

Fuel reserve approaching winter planning threshold

INFO

SATCOM synchronization completed

Filters:

ALL

CRITICAL

WARNING

INFO

Add:

MARK AS REVIEWED

using local state.

==================================================

REPORTS PAGE

==================================================

Create:

OPERATIONAL REPORTS

DAILY STATION REPORT

RESOURCE STATUS REPORT

INCIDENT REPORT

RESILIENCE REPORT

SCENARIO ANALYSIS

Buttons:

VIEW

EXPORT

Use demo interactions.

==================================================

SETTINGS PAGE

==================================================

Create:

SYSTEM SETTINGS

APPEARANCE

Light / Dark

OPERATIONS

Station

Default view

Refresh interval

NOTIFICATIONS

Critical alerts

Warnings

System notifications

SYSTEM

Demo mode

Data provenance

About PolarOps

==================================================

EXPLANATION DRAWER

==================================================

Implement a functional right-side drawer.

OPEN EXPLANATION opens:

G-02 · INCIDENT EXPLANATION

Sections:

WHAT HAPPENED?

WHY DOES IT MATTER?

WHAT DEPENDS ON IT?

WHAT COULD HAPPEN NEXT?

WHAT SHOULD THE OPERATOR REVIEW?

Use labels:

OBSERVED

DERIVED

ILLUSTRATIVE

DEMO

==================================================

G-02 INTERACTIONS

==================================================

INSPECT G-02

→ detailed asset view

VIEW DEPENDENCIES

→ Digital Twin with G-02 path highlighted

OPEN EXPLANATION

→ explanation drawer

Keep these interactions connected.

==================================================

DEMO DATA

==================================================

Create centralized data modules:

demoStationData

demoMetrics

demoG02

demoTimeline

demoDependencies

demoActivities

demoResources

demoScenarios

demoAlerts

demoReports

Do not scatter hardcoded values throughout components.

Make the UI easy to connect to a real API later.

==================================================

RESPONSIVE DESIGN

==================================================

Desktop:

1440–1920px optimized.

Tablet:

adaptive grids.

Mobile:

collapsible sidebar and stacked content.

Avoid horizontal overflow.

==================================================

ACCESSIBILITY

==================================================

Use:

semantic headings

keyboard navigation

visible focus states

ARIA labels

sufficient contrast

Theme button:

aria-label="Toggle theme"

==================================================

FINAL QUALITY REQUIREMENT

==================================================

The final Preview must contain:

✓ Complete sidebar

✓ Top command bar

✓ Light/Dark mode

✓ Command Center

✓ 2×2 metrics

✓ Digital Twin

✓ Station topology

✓ G-02 Critical Event

✓ G-02 Asset Intelligence

✓ Incident Timeline

✓ Causal Reasoning

✓ Dependency Model

✓ Recommendation

✓ Human Approval workflow

✓ Operational Activity

✓ Explanation Drawer

✓ Digital Twin page

✓ Stations page

✓ Resources page

✓ Scenarios page

✓ Resilience page

✓ Alerts page

✓ Reports page

✓ Settings page

✓ Working navigation

✓ Working interactions

✓ Responsive design

✓ Centralized demo data

IMPORTANT:

Do not stop and ask questions.

Do not request backend information.

Do not return a plan instead of building.

Do not leave placeholder screens.

Use local demo data.

BUILD THE COMPLETE POLAROPS PROTOTYPE NOW AND UPDATE THE PREVIEW.

The result should look like a serious Antarctic expedition operations platform suitable for a Smart India Hackathon 2026 demonstration.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://polarops-insight.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0833f1cd-965c-4bf2-afd6-5f979b6fa7a5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
