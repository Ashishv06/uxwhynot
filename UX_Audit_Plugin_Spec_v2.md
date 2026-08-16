# AI-Powered UX Audit & Benchmarking Plugin — Spec v2

## Purpose

An AI-driven skill that takes a product (URL, or a URL plus a short description) and runs a structured, evidence-based UX and accessibility audit using the same methodology proven on the SkillGlobe audit: real product exploration, heuristic evaluation, WCAG 2.1 AA accessibility checks, screenshot-backed findings, competitive benchmarking, and prioritized recommendations.

This is not a "generate a generic UX critique" tool. Every finding must be traceable to something the agent actually saw, checked, or scored, with an explicit note on how confident that finding is.

## Core Principle (governs every other section)

Every finding is labeled by how it was verified, not stated as fact by default:

- **Automated** — objectively measured (contrast ratio, DOM structure, missing `alt` text, label association)
- **Simulated** — scripted behavior standing in for a real check (Tab-key sequence + `document.activeElement` inspection standing in for real keyboard-only use)
- **Unable to verify** — flagged, not silently skipped (true screen-reader behavior, real assistive-tech users, subjective content tone)

Competitor scores carry the same honesty rule by default: audited-product scores come from hands-on testing, competitor scores are estimates from browsing, not independent audits. This caveat ships baked into every report, not as an optional footnote.

## v1 Scope (build this first)

- Guided exploration of up to 5-6 key flows on one product (marketing site, signup/onboarding, login, 2-3 core authenticated flows)
- Heuristic evaluation + WCAG 2.1 AA pass on those flows, severity-ranked, screenshot per finding
- Benchmarking against one competitor tier (up to 4 competitors), single merged benchmarking output
- Now / Next / Later prioritization tied to business impact
- One polished, client-ready report (PDF or docx)

## v2 Roadmap (explicitly deferred, do not build into v1)

- Fully autonomous multi-tier competitor discovery
- Interactive HTML dashboard with live filtering, radar charts
- Automated competitor screenshot capture (site CSPs will block some of this — see Known Constraint below)
- Multi-product / multi-tier benchmarking in a single run

## Known Constraint: Competitor Screenshot Capture

Some sites (confirmed: Indeed, LinkedIn) block cross-origin asset fetches via CSP, which breaks automated screenshot capture. When this happens, the plugin should not fabricate or silently skip the evidence. It should fall back to a text-only finding with an explicit caption: "Live screenshot blocked by [Site]'s site policy — pattern verified via direct browsing." This already happened once and is a known, recurring failure mode, not an edge case.

---

## 1. Input & Scoping

Input:

- Product URL (required)
- Optional short description, target audience, industry
- Optional competitor URLs (if omitted, the agent proposes candidates for the user to confirm, it does not auto-select silently)
- Optional list of specific flows to prioritize

**Authentication, handled safely:** the plugin never receives, stores, or enters passwords or account credentials. For any flow that requires being logged in, the user authenticates themselves in a browser session the agent can observe, then the agent explores and documents from that already-authenticated state. This mirrors how the SkillGlobe audit actually worked and keeps the plugin inside standard credential-handling safety rules.

**Scope guardrail:** before deep work starts, the plugin proposes a scope (which flows, how many competitors, estimated finding count) and shows it to the user for a quick confirm/adjust. This prevents both runaway scope (trying to audit everything) and silent under-coverage (skipping things without saying so).

## 2. Guided Product Exploration

Explore the confirmed flows end-to-end as a real user or account admin would, not isolated screens in random order. Typical path: marketing site → signup → onboarding → login → core authenticated flow → completion.

Record, per screen: navigation structure, forms and validation behavior, error/empty/loading states, modals, terminology, and conversion points. Every meaningful interaction becomes part of the audit trail, not just the ones that turn into findings.

## 3. Heuristic Evaluation

Evaluate each explored screen against standard usability heuristics: navigation clarity, error handling, form design, visual hierarchy, consistency, mental model / terminology fit, feedback, and affordances.

Every finding gets a severity: **Critical / Major / Moderate / Minor / What Works**. The "What Works" category is mandatory, not optional, an audit that is 100% criticism reads as biased even when accurate.

## 4. Accessibility Audit (WCAG 2.1 AA)

Check, and label each per the Core Principle above (automated / simulated / unable to verify):

- **Visual:** color contrast, text contrast, resizing, hierarchy
- **Keyboard:** tab order, focus visibility, keyboard traps, skip navigation
- **Screen reader / semantic:** label association, accessible names, ARIA landmarks, heading structure
- **Interaction:** touch target sizing, error message clarity, modal/dropdown accessibility
- **Content:** alt text, heading hierarchy, link purpose, error identification and suggestions

Each accessibility finding includes: WCAG criterion, verification method, affected element, evidence, impact, severity, and recommended fix.

## 5. Evidence Capture

Every finding above Minor severity gets a screenshot: page/screen name, URL, affected element, and (where feasible) a highlight on the problem area. No finding above Minor ships without evidence attached. Report structure per finding: **Finding → Evidence → Impact → Recommendation.**

## 6. Competitive Benchmarking (single merged phase)

One phase, three outputs, not five separate sections:

1. **Feature Comparison Matrix** — audited product vs. each competitor, with a short explanation of meaningful differences, not just check marks
2. **Flow Comparison** — for 2-3 shared critical flows (e.g., signup, core task), compare step count, friction points, error handling, and completion effort
3. **UX Scoring Matrix** — 1-5 per dimension (suggested: Learnability, Task Focus, Search/Discovery, Accessibility, Consistency, plus 1-2 product-specific dimensions), each score with a one-line rationale tied back to an actual finding, plus a total score row

Confidence caveat (see Core Principle) is printed directly above this section in every report.

## 7. Business Impact & Prioritization (merged)

Every Critical and Major finding maps to a business consequence: activation loss, conversion loss, support load, compliance exposure, trust erosion, or task abandonment, then goes directly into a priority bucket:

- **NOW** — critical, high-impact, address immediately
- **NEXT** — meaningful improvements following the immediate fixes
- **LATER** — lower-impact or strategic polish

No separate "impact analysis" step disconnected from prioritization, impact is the input that decides the bucket.

## 8. Finding Format (applies to every finding in the report)

```
Finding ID       UX-014
Category         Usability / Accessibility / Navigation / Forms / Content
Severity         Critical / Major / Moderate / Minor
Verification     Automated / Simulated / Unable to verify
Page             Screen or page name
Issue            What is wrong, specifically
Evidence         Screenshot
User Impact      How the user is affected
Business Impact  Likely consequence
WCAG Reference   If applicable
Recommendation   Practical, specific fix
Priority         Now / Next / Later
Effort           Low / Medium / High
```

Bad example (never produce this): "The website could improve its navigation."

Good example (the bar to hit): "UX-014, Navigation ambiguity. Users may not find organization settings because the nav label doesn't match terminology used elsewhere in the product. Impact: increased cognitive load, potential task abandonment. Priority: NOW. Recommendation: rename the nav item to match the user's mental model, validate via usability testing."

## 9. Report Structure & Executive Summary

Report opens with: overall UX score, accessibility status, finding counts by severity, top 5 problems, top 5 opportunities, competitive position, and recommended immediate actions. Closes with a short "How This Audit Was Conducted" section listing the phases above, so the report is self-explaining to someone who wasn't in the room.

## 10. Deliverables

- **v1:** one polished PDF or docx report (cover page, executive summary, methodology, findings by section, accessibility audit, benchmarking, prioritization, roadmap)
- **v2 (deferred):** interactive HTML dashboard with filtering and charts

## Standards & Frameworks

Nielsen usability heuristics, WCAG 2.1 Level AA, severity triage, Now/Next/Later prioritization, 1-5 scoring matrix with mandatory rationale, evidence-based findings only.

## Quality Bar

If a finding could be pasted into the report as-is and a skeptical client could reasonably ask "based on what?", it's not done yet. Every finding needs a verification method, evidence, and a specific recommendation, not a generic observation.
