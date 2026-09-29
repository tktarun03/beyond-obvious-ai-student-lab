# Learning path: from prompt to verified feature

Choose a pace that suits you. The milestones below describe work to complete, not
features that already exist in the five project scaffolds.

| Stage       | Activity                                                                         | Proof of completion                                                  |
| ----------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1 · Start   | Install with `npm ci`; open the portal; list Astra demos                         | You can explain which parts run offline                              |
| 2 · Context | Complete two [prompt exercises](../gpt-6-astra/10-LIVE-DEMO-PROMPTS.md)          | Mark evidence, assumptions and failed review checks                  |
| 3 · Verify  | Compare one change using the [evaluation workbook](../gpt-6-astra/EVALUATION.md) | Keep both successful and failed attempts                             |
| 4 · Trace   | Read one auth, database and provider test                                        | Explain the boundary each test protects                              |
| 5 · Build   | Pick one project; implement a small mock-first vertical slice                    | A user can complete one task through UI, validation and server logic |
| 6 · Harden  | Add invalid input, ownership, timeout and accessibility cases                    | Demonstrate a regression caught by a check                           |
| 7 · Share   | Write a short demo, limitations and reproduction steps                           | Another student can run it without your help                         |

## Suggested first slices

- Knowledge copilot: retrieve from three synthetic paragraphs; show the exact source.
- Document intelligence: extract fields from one fictional invoice; require review for missing fields.
- Voice assistant: start with text intent/slots in English and Tamil before adding speech.
- Engineering agent: review a supplied diff and show a proposal without executing it.
- Data assistant: validate a tiny CSV and compute totals using deterministic code.

Treat live providers as an optional later integration. A paid model is not required to
learn validation, ownership, error recovery, accessibility or reproducible evaluation.
Bring back one small improvement with a reproducible check.
