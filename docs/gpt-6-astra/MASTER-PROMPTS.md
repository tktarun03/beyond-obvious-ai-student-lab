# GPT-6 Astra — Master Prompt Library

These templates are intentionally direct. Replace bracketed fields with relevant, approved context; omit sections that do not help. [Runnable examples](10-LIVE-DEMO-PROMPTS.md) include complete synthetic inputs. [Measure results](EVALUATION.md) before choosing more effort.

## Master prompt — engineering analysis

```text
You are helping solve a real engineering problem.

OBJECTIVE
[desired outcome]

CONTEXT
[relevant architecture, code, logs, requirements, versions, metrics]

CONSTRAINTS
[security, performance, compatibility, delivery, budget, accessibility, platform]

NON-GOALS
[what must not be changed]

KNOWN FACTS
[facts supported by evidence]

UNKNOWN / AMBIGUOUS
[open questions]

SUCCESS CRITERIA
[measurable definition of done]

WORKING RULES
- Do not invent missing evidence.
- Distinguish facts from assumptions.
- Prefer the smallest safe solution before proposing a rewrite.
- Surface trade-offs and failure modes.
- If a critical unknown materially changes the solution, ask a focused question before committing to it; otherwise proceed with a stated assumption.
- Do not reveal or fabricate hidden chain-of-thought; provide concise conclusions and evidence instead.

VERIFY
Check edge cases, security boundaries, regression risks, operational impact, and testability.

OUTPUT
1. Problem framing
2. Findings
3. Recommended approach
4. Implementation steps
5. Verification plan
6. Risks and remaining unknowns
```

## Master prompt — coding

```text
GOAL
Implement [feature/fix].

STACK
[language/framework/runtime/version]

RELEVANT FILES
[only files needed]

CURRENT BEHAVIOR
[what happens now]

EXPECTED BEHAVIOR
[what should happen]

CONSTRAINTS
- preserve public API unless explicitly allowed
- avoid unrelated refactors
- preserve accessibility/security guarantees
- follow existing repository conventions

ACCEPTANCE TESTS
[testable criteria]

VERIFY
Before finishing, check type errors, linting, tests, boundary cases, backward compatibility and likely regressions.

OUTPUT
Return the patch/code, a concise explanation, tests added/changed, and any unverified assumptions.
```

## Master prompt — architecture

```text
Design or review an architecture for [system].

LOAD / SCALE
[traffic, data, concurrency]

SLOs
[availability, latency, RPO, RTO]

DATA
[sensitivity, residency, retention]

TEAM / OPERATIONS
[team size, deployment model, maturity]

CONSTRAINTS
[cloud/vendor/legacy/budget/regulation]

Evaluate:
- request/data flow
- scaling bottlenecks
- failure domains
- security boundaries
- observability
- deployment and rollback
- disaster recovery
- cost
- developer experience
- migration path

Do not optimize for theoretical scale that is irrelevant to the supplied requirements.
Return an ADR-style recommendation with alternatives and trade-offs.
```

## Master prompt — incident/root cause

```text
Analyze this incident using only the supplied evidence.

TIMELINE
[events]

METRICS / LOGS / TRACES
[evidence]

RECENT CHANGES
[deployments/config/data changes]

IMPACT
[users/services/time period]

Create:
1. observed facts
2. ranked hypotheses
3. evidence for/against each
4. cheapest test to falsify each hypothesis
5. likely root cause only if supported
6. containment options
7. permanent fix
8. regression/monitoring checks

Do not confuse temporal correlation with causation.
```

## Master prompt — large-context document/repository review

```text
OBJECTIVE
[what decision/output you need]

SOURCE PRIORITY
1. [highest-authority file/source]
2. [second]
3. [third]

SCOPE
Review only information relevant to:
- [topic 1]
- [topic 2]
- [topic 3]

IGNORE
- duplicate background material
- obsolete versions unless needed for comparison
- unrelated sections

OUTPUT
For every material conclusion, identify the supporting source or code location.
Separate:
- verified evidence
- interpretation
- unresolved gaps

Do not summarize everything; extract only what changes the decision.
```

## Master prompt — UI/UX engineering

```text
Review this UI implementation as both a frontend engineer and accessibility-focused UX reviewer.

TARGET USERS
[user groups / devices / locales]

TASK
[user journey]

STACK
[Angular/React/Ionic/etc.]

CHECK
- semantic structure
- keyboard operation
- focus management
- screen-reader behavior
- responsive behavior
- loading/empty/error states
- localization resilience
- low-bandwidth behavior if relevant
- performance
- design-system consistency

Return prioritized findings with user impact, code/design evidence, minimal remediation and test method.
```

## Master prompt — India-scale public/consumer system

```text
Design [system] for Indian usage patterns without assuming every user has a fast network or premium device.

CONSIDER WHERE RELEVANT
- burst traffic
- low-bandwidth / intermittent connectivity
- affordable Android devices
- multilingual content
- OTP retries/rate limits
- payment idempotency
- accessibility
- offline/recovery flows
- Indian date/number/time formats
- support and grievance flows

Do not assume a legal or regulatory requirement applies. Flag where current authoritative verification is required.
Return architecture, UX states, failure recovery, observability, tests and rollout strategy.
```

## Master prompt — global enterprise system

```text
Design/review [system] for multi-region enterprise use.

CONSIDER
- regional isolation
- data residency
- localization
- tenant boundaries
- RBAC/ABAC
- audit logging
- SLOs/error budgets
- regional failover
- DR testing
- vendor portability
- cost controls
- accessibility

Return the decision, alternatives, trade-offs, rollout stages and evidence needed before production approval.
```
