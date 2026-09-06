---
name: research-verification
description: Focused guidance for verifying external claims, maintaining scientific honesty, and categorizing data and architectural assumptions in PolarOps.
---

# Research Verification Skill

This skill enforces scientific rigor and data honesty across all engineering, modeling, and documentation activities in PolarOps.

---

## 1. Evidence Hierarchy

When documenting technical decisions or Antarctic operational facts, adhere to this evidence hierarchy:

```text
1. Official Documentation / Primary Source (e.g. NCPOR official portal, React/FastAPI docs)
        ↓
2. Peer-Reviewed / Authoritative Research (e.g. Cambridge CDBB, BAS polar infrastructure papers)
        ↓
3. Reputable Institutional Reference (e.g. IMD weather archives, WMO reports)
        ↓
4. Secondary Technical Literature (e.g. Industry whitepapers, standard tutorials)
        ↓
5. Unverified Assertion (Must be labeled [REQUIRES FUTURE VALIDATION])
```

---

## 2. Mandatory Claim Classifications

Every claim, dataset, or modeled calculation in PolarOps MUST be explicitly tagged with one of the standard classifications defined in [EVIDENCE_REGISTER.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/research/EVIDENCE_REGISTER.md):

- `[PROVEN IN RESEARCH/DEPLOYMENT]`: Backed by cited literature or published technical benchmarks.
- `[OUR ANTARCTIC ADAPTATION]`: Our domain adaptation tailored specifically to Maitri/Bharati stations.
- `[OUR DESIGN]`: Software architecture, UI layout, and risk calculation algorithms designed by our team.
- `[SYNTHETIC DEMONSTRATION]`: Simulated sensor telemetry, inventory records, and what-if scenario parameters.
- `[REQUIRES FUTURE VALIDATION]`: Physical hardware or protocol integrations requiring real on-station testing.

---

## 3. Core Integrity Rules
1. **Never Upgrade Classifications**:
   - An agent must NEVER convert a `[SYNTHETIC DEMONSTRATION]` or `[REQUIRES FUTURE VALIDATION]` claim into `[PROVEN IN RESEARCH/DEPLOYMENT]` without providing a newly verified primary source.
2. **No Fabricated Sources**:
   - Never generate hallucinated URLs, authors, or paper titles. All bibliography entries must be recorded in [SOURCES.md](file:///c:/Users/Kshitij%20Parkhe/OneDrive/Desktop/PolarOps/docs/research/SOURCES.md).
3. **Data Honesty in Code & UI**:
   - Simulated sensor readings must always emit `truth_type: "SYNTHETIC"` or `"SCENARIO"`. Never label simulated telemetry as live real-time feeds from NCPOR stations.
