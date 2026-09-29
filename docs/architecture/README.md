# Architecture and implementation boundaries

This npm workspace monorepo separates reusable engineering boundaries from learner apps.
The portal at `apps/portal` is implemented. The five folders under `projects/` contain
configuration and smoke evals, but their product screens and end-to-end workflows are
not implemented yet.

| Area                     | Responsibility                                                                    | Current limitation                                            |
| ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `apps/portal`            | Project catalogue and offline prompt lab                                          | A learning UI, not an AI chat service                         |
| `examples/gpt-6-astra`   | Shared scenario fixtures, prompt builder, effort heuristic and CLI                | No live-model execution or accuracy measurement               |
| `packages/ai`            | Provider abstraction, deterministic mock, optional Gemini adapter, eval framework | Live integration needs separate setup and validation          |
| `packages/auth`          | Session/auth interfaces and dev/Firebase implementations                          | Dev accounts are not production authentication                |
| `packages/database`      | Ownership-aware memory/Firestore boundaries                                       | Memory state disappears on restart                            |
| `packages/validation`    | Environment, input and upload validation                                          | App routes must actually invoke the checks                    |
| `packages/observability` | Logs, spans, redaction and usage accounting                                       | Instrumentation is not a substitute for production monitoring |
| `packages/ui`            | Tokens and reusable interface primitives                                          | App journeys still need accessibility verification            |

## Prompt-lab data flow

`scenarios.ts` is the single source for exercise content. The CLI and portal pass the
selected record into `buildScenarioPrompt`. It adds the synthetic fixture and working
rules. `recommendWorkflow` supplies a local heuristic; the UI never sends a model request.

The fixtures include deliberately defective snippets as strings. They are evidence for
analysis, not executable application code. Review checks are human grading criteria.
Vitest validates packaging and routing, while Playwright exercises real portal interactions.

## When implementing a project

Authenticate before accessing another user's data, validate before spending tokens, and
invoke the shared provider/database boundaries from server code. Keep untrusted documents
as evidence rather than privileged instructions. Add one end-to-end vertical slice and
behavioral evals before adding more screens. See [the learning path](../learning-path/README.md).
