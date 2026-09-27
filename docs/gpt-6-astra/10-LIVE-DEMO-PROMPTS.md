# GPT-6 Astra — 10 Live IT Demonstrations

These demos are designed for a video or workshop. Each one shows a weak prompt, a stronger prompt, and what viewers should observe.

## Demo 1 — Angular production bug

**Scenario:** A checkout page intermittently shows duplicate payment confirmation after a retry.

**Weak prompt**

```text
Fix this Angular bug.
```

**Strong prompt**

```text
GOAL
Find the root cause of duplicate payment confirmation after a failed network retry.

CONTEXT
Angular frontend calls POST /payments/confirm. Users may tap retry after a timeout. Backend supports an idempotency key, but the frontend currently creates a new UUID for every retry.

CONSTRAINTS
- Do not change the backend contract.
- Preserve the existing UX.
- Must work with flaky mobile networks.

SUCCESS CRITERIA
- Same logical payment uses one idempotency key across retries.
- Regression test proves duplicate confirmation cannot be triggered by a client retry.

OUTPUT
Return root cause, minimal code change, test cases, and rollout risk.

VERIFY
Check race conditions, refresh behavior, and multi-tab behavior.
```

**Observe:** Astra should connect retry semantics with idempotency rather than only patching the UI symptom.

---

## Demo 2 — India-scale exam portal

**Scenario:** A results portal must handle a huge traffic spike after results are published.

```text
Design a web architecture for an Indian exam-results portal that may receive 3 million requests in the first 10 minutes after release.

Constraints:
- Results are read-heavy and immutable after publication except for corrections.
- Students commonly use mobile networks.
- Must degrade gracefully under overload.
- Avoid a big-bang dependence on one cloud vendor.

Return:
1. request flow
2. caching strategy
3. data-store pattern
4. queue/back-pressure approach
5. failure modes
6. observability
7. load-test plan
8. cost-control ideas

Explicitly state assumptions and show which assumptions most affect the architecture.
```

**Observe:** Good reasoning should focus on CDN/cacheability, read replicas/object delivery, overload protection, and verification—not just add more servers.

---

## Demo 3 — React accessibility review

```text
Review the supplied React modal component for accessibility.

Target: WCAG 2.2 AA.
Check keyboard navigation, focus trapping/restoration, escape handling, semantic roles, accessible name/description, background interaction, screen-reader behavior and error states.

Return only actionable issues. For each issue provide:
- severity
- affected behavior
- exact code location
- minimal fix
- test method
```

**Observe:** The output contract reduces generic accessibility advice.

---

## Demo 4 — Global SaaS multi-region decision

```text
We run a B2B SaaS platform in India, EU and US regions.
Compare active-active and active-passive deployment for our API and PostgreSQL data layer.

Requirements:
- 99.95% availability
- RPO <= 5 minutes
- RTO <= 30 minutes
- tenant data residency must be configurable
- engineering team of 12
- operational simplicity matters

Do not select based on theoretical maximum availability alone.
Evaluate operational complexity, replication conflicts, failover behavior, cost, observability, testing burden and recovery drills.

Return an ADR-style comparison and a decision framework. Mark all assumptions.
```

**Observe:** The model should reason from team size and operating model, not only architecture purity.

---

## Demo 5 — Node.js API performance investigation

```text
We have a Node.js API where p95 latency increased from 180 ms to 1.8 s after a release.
Evidence:
- CPU: 35%
- memory stable
- DB query p95: 110 ms
- upstream API p95: 900 ms
- event-loop lag spikes to 400 ms
- release added synchronous JSON transformation for large payloads

Build a ranked hypothesis tree.
For each hypothesis give:
- evidence for
- evidence against
- cheapest confirming experiment
- expected metric change if true

Then propose the safest mitigation order.
Do not claim a root cause until the evidence supports it.
```

**Observe:** This teaches falsification instead of confident guessing.

---

## Demo 6 — Legacy Java modernization

```text
Create an incremental modernization plan for a 12-year-old Java monolith.

Current state:
- 1.2M lines of code
- shared Oracle schema
- monthly releases
- 40 developers
- business cannot tolerate a 12-month rewrite freeze

Target:
- independently deployable domains
- better release frequency
- preserve existing business behavior during migration

Return:
1. domain-seam discovery approach
2. strangler sequence
3. database transition options
4. contract testing
5. feature-flag/rollback strategy
6. observability
7. milestones and exit criteria
8. what NOT to modernize first
```

**Observe:** Astra should avoid proposing a heroic rewrite.

---

## Demo 7 — UPI-style payment workflow reasoning

```text
Design the client/server interaction for a payment flow where the user may lose connectivity after authorizing payment but before receiving confirmation.

Goals:
- never show a false success
- avoid duplicate payment attempts
- let the user safely recover after reopening the app

Return a state machine with states, transitions, idempotency behavior, reconciliation flow, UX messages and test cases.
Do not rely on the client alone as the source of truth.
```

**Observe:** This is a good demonstration of state reasoning and recovery design.

---

## Demo 8 — Pull-request review

```text
Review this pull request as a senior engineer.

Prioritize only defects or risks that could materially affect production.
Check:
- correctness
- authorization/data exposure
- concurrency
- performance
- accessibility if UI is involved
- backward compatibility
- test gaps

For each finding include evidence from the diff, impact, confidence, and smallest safe remediation.
Do not invent code that is not in the supplied diff or repository context.
```

**Observe:** Strong context boundaries reduce hallucinated findings.

---

## Demo 9 — Requirements to engineering plan

```text
Business requirement:
"Allow customers to change delivery address until dispatch, but some orders contain items shipped from different warehouses."

Convert this into engineering-ready requirements.
Return:
- domain rules
- ambiguous questions
- state-transition rules
- API impacts
- UI states
- data changes
- audit requirements
- concurrency risks
- acceptance tests

Separate confirmed requirements from assumptions.
```

**Observe:** Astra can convert vague language into implementation questions without pretending ambiguity does not exist.

---

## Demo 10 — Incident postmortem

```text
Create a blameless postmortem from the supplied incident timeline.

Rules:
- distinguish observed facts from hypotheses
- do not assign personal blame
- identify why existing controls failed to prevent or detect the issue
- actions must have owners by role, measurable completion criteria and verification

Return:
1. executive summary
2. customer impact
3. timeline
4. root cause and contributing factors
5. detection/response gaps
6. corrective actions
7. lessons that generalize beyond this incident
```

**Observe:** The value is disciplined synthesis and action quality, not a long narrative.

---

# Suggested on-screen demo pattern

For every live demo, show three panels:

```text
BAD PROMPT -> BETTER CONTEXT -> VERIFIED OUTPUT
```

The lesson is consistent: **the model cannot infer your real constraints if you never provide them.** At the same time, do not flood it with irrelevant context.
