# A 60-minute community workshop

Audience: students and developers who can read basic code. No paid API key is required
for the repository. An instructor may demonstrate with their own approved AI account;
participants can also review prepared, clearly labeled example answers offline.

## Before the session

- Run `npm ci`, `npm run astra:check` and `npm run dev`.
- Open [the local prompt lab](http://localhost:3000/prompt-lab).
- Choose demo 2 plus either 3, 5 or 8. Keep evidence and review criteria ready.
- Explain that all data is synthetic and effort values shown are recommendations from a local heuristic.
- If demonstrating an external model, check account access and tools in advance. The repo cannot set ChatGPT effort through a prompt.

| Minutes | Activity                                               | Evidence of learning                                                          |
| ------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 0–5     | Introduce goal, evidence, constraints and verification | Each learner names one failure a vague prompt can hide                        |
| 5–15    | Compare weak/full exam-portal prompts                  | Learners distinguish average throughput from peak and protect private results |
| 15–30   | Pairs run or inspect an engineering exercise           | Mark every claim as supported, assumed or unsupported                         |
| 30–40   | Swap answers and apply the rubric                      | Four scenario checks plus a 0–10 score with reasons                           |
| 40–50   | Change one constraint; shorten irrelevant context      | Record what changed and whether correctness was preserved                     |
| 50–57   | Inspect the router and discuss when no AI is needed    | Explain one deterministic, one fast-model and one Astra candidate             |
| 57–60   | Submit a correction or propose a contribution          | A reproducible issue or small PR draft                                        |

## Facilitator prompts

- “Which supplied fact makes that recommendation reasonable?”
- “What would disprove this explanation?”
- “Was this test executed, or merely suggested?”
- “What is unknown, and would it change the implementation?”
- “Can ordinary code solve this part exactly?”

## Tamil-friendly delivery

Explain in Tamil, English or both while keeping code, identifiers and commands intact.
For a learner-produced translation, have another fluent speaker review technical meaning.
A useful closing question: “இந்த முடிவுக்கு ஆதாரம் என்ன?” — “What is the evidence for this conclusion?”
Do not translate API identifiers or silently change the exercise's acceptance criteria.

## Submission

Ask each pair for the demo ID, their revised prompt, four check decisions, one mistake
they caught and one improvement. A screenshot alone is not a reproducible result.
A small correction or reproducible failure makes a useful first contribution.
