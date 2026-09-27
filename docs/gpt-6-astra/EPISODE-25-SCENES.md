# Beyond the Obvious — GPT-6 Astra Reasoning & Context

## Production rules

- 25 scenes, approximately 9.5–10 seconds each.
- Presenter remains visually consistent across every scene: same face, beard, hair, clothing, studio, desk, lighting and framing.
- Camera fully locked: no zoom, pan, tilt, dolly, drift, shake or reframing.
- Natural blinking, breathing, small head movement and restrained hand gestures only.
- Do not morph face, hands, body, laptop or desk objects.
- Use clean PIP only when a demo needs it. PIP must remain stable and readable.
- Never generate fake terminal text or rapidly changing nonsense code. Use short, pre-defined text only.
- No repeated dialogue words. If speech ends before 10 seconds, leave natural silence.
- Professional Indian English delivery, confident but educational.
- Background music: subtle modern technology pulse, never overpower dialogue.
- Public content must remain personal and independent of any employer.

---

## Scene 01 — The real problem

**Dialogue**  
“Most people blame the AI when the answer is weak. Very often, the real problem is the task we gave it.”

**Visual**  
Presenter at desk. Floating graphic: `WEAK TASK -> WEAK RESULT`.

---

## Scene 02 — Introduction

**Dialogue**  
“Vanakkam, naan ungal Arun. Today, let us crack how to use GPT-6 Astra effectively for serious IT work.”

**Visual**  
Minimal title: `GPT-6 ASTRA — REASONING + CONTEXT`.

---

## Scene 03 — What reasoning really means

**Dialogue**  
“Astra reasons internally before answering. We do not need its hidden thoughts; we need stronger conclusions, evidence, checks and outcomes.”

**Visual**  
Simple animation: `INPUT -> INTERNAL REASONING -> VERIFIED OUTPUT`. Do not display hidden chain-of-thought.

---

## Scene 04 — Context is not a data dump

**Dialogue**  
“A huge context window does not mean paste everything. Give the code, evidence, constraints and decisions that can actually change the answer.”

**Visual**  
Large messy pile shrinks into four cards: `CODE`, `EVIDENCE`, `CONSTRAINTS`, `DECISIONS`.

---

## Scene 05 — Five reasoning levels

**Dialogue**  
“Astra supports low, medium, high, x-high and max reasoning effort. Match the effort to the difficulty, risk and verification needed.”

**Visual**  
Five fixed steps: `LOW -> MEDIUM -> HIGH -> XHIGH -> MAX`.

---

## Scene 06 — The six-part prompt

**Dialogue**  
“My practical formula is simple: goal, context, constraints, success criteria, verification and output. Six blocks can transform the result.”

**Visual**  
Six stable cards appear one by one.

---

# LIVE DEMONSTRATIONS

## Scene 07 — Demo 1: Angular payment bug

**Dialogue**  
“Instead of ‘fix this Angular bug,’ tell Astra the retry behavior, idempotency rule and expected test. Now it can solve the real failure.”

**PIP prompt**  
`Goal: stop duplicate confirmation`  
`Context: retry creates new idempotency key`  
`Verify: race + refresh + multi-tab`

**PIP result**  
`Root cause -> minimal fix -> regression test`

---

## Scene 08 — Demo 2: India-scale exam portal

**Dialogue**  
“Now design an Indian exam-results portal for millions of burst requests. Add mobile networks, graceful overload and load-test criteria.”

**PIP prompt**  
`3M requests / 10 min`  
`Read-heavy results`  
`Mobile networks`  
`Graceful overload`

**PIP result**  
`CDN/cache -> origin protection -> load test -> recovery`

---

## Scene 09 — Demo 3: React accessibility

**Dialogue**  
“Do not ask for a generic UI review. Ask specifically for keyboard, focus, semantics, screen readers, error states and test methods.”

**PIP prompt**  
`Target: WCAG 2.2 AA`  
`Return: issue + impact + fix + test`

**PIP result**  
Prioritized accessibility findings.

---

## Scene 10 — Demo 4: Global SaaS architecture

**Dialogue**  
“For global SaaS, compare active-active and active-passive using actual SLOs, data residency, team size, cost and recovery complexity.”

**PIP prompt**  
`India + EU + US`  
`RPO <= 5 min`  
`RTO <= 30 min`  
`Team: 12`

**PIP result**  
ADR-style trade-off matrix.

---

## Scene 11 — Demo 5: Node.js latency

**Dialogue**  
“Give Astra metrics, not feelings. Ask for ranked hypotheses, evidence for and against, and the cheapest experiment that can disprove each.”

**PIP prompt**  
`p95: 180ms -> 1.8s`  
`Upstream: 900ms`  
`Event-loop lag: 400ms`

**PIP result**  
Hypothesis tree with falsification tests.

---

## Scene 12 — Demo 6: Legacy Java modernization

**Dialogue**  
“For a twelve-year monolith, say no big-bang rewrite. Ask for seams, strangler stages, rollback, observability and what not to modernize first.”

**PIP prompt**  
`1.2M LOC`  
`40 developers`  
`Monthly releases`  
`No rewrite freeze`

**PIP result**  
Incremental modernization roadmap.

---

## Scene 13 — Demo 7: Payment recovery

**Dialogue**  
“Suppose connectivity dies after payment authorization. Ask for a state machine, idempotency, reconciliation and recovery—not just a success screen.”

**PIP prompt**  
`Never false success`  
`No duplicate attempt`  
`Recover after app reopen`

**PIP result**  
State transitions and reconciliation flow.

---

## Scene 14 — Demo 8: Pull-request review

**Dialogue**  
“For code review, restrict Astra to the supplied diff and repository context. Require evidence, production impact, confidence and the smallest safe fix.”

**PIP prompt**  
`Correctness`  
`Auth/data exposure`  
`Concurrency`  
`Performance`  
`Compatibility`

**PIP result**  
Evidence-backed findings only.

---

## Scene 15 — Demo 9: Requirements engineering

**Dialogue**  
“Give one vague business sentence and ask Astra to separate confirmed rules, assumptions, state transitions, API impact and acceptance tests.”

**PIP prompt**  
`Address can change until dispatch`  
`Multi-warehouse order`

**PIP result**  
Rules + ambiguity + implementation questions.

---

## Scene 16 — Demo 10: Incident postmortem

**Dialogue**  
“For incidents, demand facts versus hypotheses, contributing factors, detection gaps and measurable corrective actions. That prevents a confident fictional story.”

**PIP prompt**  
`Facts != hypotheses`  
`No personal blame`  
`Actions must be verifiable`

**PIP result**  
Structured blameless postmortem.

---

## Scene 17 — More context can hurt

**Dialogue**  
“More context is not automatically better. Duplicate instructions, stale documents and irrelevant files compete with the evidence that actually matters.”

**Visual**  
`MORE TOKENS != MORE CLARITY`.

---

## Scene 18 — Stop forcing chain-of-thought

**Dialogue**  
“Do not keep saying ‘think step by step.’ Give a clear goal, hard constraints and an explicit output contract; Astra already reasons internally.”

**Visual**  
Cross out: `THINK STEP BY STEP`.  
Replace with: `GOAL + CONSTRAINTS + OUTPUT`.

---

## Scene 19 — Choosing effort intelligently

**Dialogue**  
“Low for simple bounded work. Medium for normal engineering judgment. High and x-high for interacting constraints. Max only when the hardest work justifies it.”

**Visual**  
Effort ladder with example tags.

---

## Scene 20 — When Astra shines

**Dialogue**  
“Use Astra when coding, research, tools, ambiguous requirements and verification must work together across a long, multi-step task.”

**Visual**  
Icons: code, browser, files, architecture, test checkmark.

---

## Scene 21 — When Astra is overkill

**Dialogue**  
“Do not spend maximum intelligence on formatting, fixed templates, bulk tagging or deterministic calculations. Faster models or normal code may be better.”

**Visual**  
Split screen: `ASTRA` versus `FAST MODEL / CODE`.

---

## Scene 22 — When not to use an LLM

**Dialogue**  
“Authorization, cryptography, ledger calculations and destructive production actions need deterministic controls. AI can assist analysis, but should not become the control itself.”

**Visual**  
Shield graphic around `HUMAN / DETERMINISTIC CONTROL`.

---

## Scene 23 — Enterprise privacy rule

**Dialogue**  
“Never paste secrets, customer data, private source code or confidential architecture into an unapproved AI workflow. Use sanitized, synthetic examples.”

**Visual**  
Redacted credentials and anonymized sample data.

---

## Scene 24 — GitHub cheatsheet

**Dialogue**  
“I have added the full prompt cheatsheet, ten demos, master templates and an effort-selection code example to the GitHub learning repo.”

**Visual**  
Stable repository tree showing: `CHEATSHEET`, `10 LIVE DEMOS`, `MASTER PROMPTS`, `prompt router`.

---

## Scene 25 — Closing

**Dialogue**  
“If this was useful, like, share and comment with the IT problem you want decoded next. Question. Explore. Rethink.”

**Visual**  
Presenter remains seated. Minimal closing title: `BEYOND THE OBVIOUS` and `Question. Explore. Rethink.`

---

## Public disclaimer

Personal perspectives on technology, AI, careers and the digital future. Views expressed are my own and do not represent my employer or any organization I am associated with.
