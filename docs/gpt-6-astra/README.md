# GPT-6 Astra — the practical engineering prompt lab

**Learn to give useful context, verify answers and spend effort where it matters.**
Built by [Arunkumar Thamilarasu](https://github.com/tktarun03) for the
[Beyond the Obvious](https://www.youtube.com/@BeyondObviousArun) community.
India-focused examples sit alongside global engineering problems. All fixtures are synthetic.

## Start in five minutes

From the repository root, with Node.js and npm installed:

```bash
npm ci
npm run astra -- --list
npm run astra -- --demo 01-payment-retry
```

Copy the generated prompt into your chosen assistant and compare its answer with the exercise's review criteria. To browse, search and copy visually:

```bash
npm run dev
```

Open [the local prompt lab](http://localhost:3000/prompt-lab).
The CLI and portal generate prompts locally; they make **no AI API calls** and require no key.
Using a separate AI service may require an account and incur that service's charges.
The lab does not configure your ChatGPT settings or automatically change model effort.

## Choose your route

| Your goal                                      | Resource                                                    | Time                 |
| ---------------------------------------------- | ----------------------------------------------------------- | -------------------- |
| Get a useful answer with less back-and-forth   | [Cheatsheet](CHEATSHEET.md)                                 | 10 min               |
| Practice with code, logs and acceptance checks | [Ten reproducible demos](10-LIVE-DEMO-PROMPTS.md)           | 15–25 min each       |
| Lead a college or community session            | [Workshop](WORKSHOP.md)                                     | 60 min               |
| Measure quality, effort and cost fairly        | [Evaluation workbook](EVALUATION.md)                        | 20 min setup         |
| Reuse a task-specific template                 | [Master prompts](MASTER-PROMPTS.md)                         | 5 min                |
| Inspect the pure TypeScript helpers            | [Router](../../examples/gpt-6-astra/astra-prompt-router.ts) | 15 min               |
| Create the episode                             | [25-scene script](EPISODE-25-SCENES.md)                     | Production reference |
| Verify model-specific claims                   | [Sources and freshness](SOURCES.md)                         | Before API use       |

## What works today

- Ten complete prompts, each with synthetic input, constraints and four human review criteria.
- Searchable portal with copy fallback, mobile layout and keyboard-friendly controls.
- CLI text/JSON export, with clear errors for invalid exercise IDs and flags.
- Deterministic routing, content and browser checks in CI.
- No measured live-model scores or guaranteed cost savings are claimed.

```bash
npm run astra -- --demo 02-exam-portal --json
npm run --silent astra -- --demo 08-pr-review > prompt.txt
npm run astra:check
npm run verify
```

The five AI application workspaces elsewhere in this repository remain student scaffolds.
Their optional live provider is separate from this offline Astra module.

## The working method

1. Define the outcome and acceptance criteria.
2. Provide the smallest set of relevant evidence and constraints.
3. Choose code, an efficient model, or Astra based on the task.
4. Ask for concise conclusions, evidence and verification results.
5. Check the answer; improve the missing context before raising effort.

The router is a **local teaching heuristic**, not OpenAI guidance or a security control.
Higher effort cannot replace authorization, human review or evidence. See the
[evaluation workbook](EVALUATION.md) before interpreting an effort suggestion as an optimum.

## Community shout-out

To students in Tamil Nadu, across India and around the world, and to the teachers,
engineers, testers and translators helping them: **thank you for learning in public and
making the next person's first step easier.** Found a better example? Contribute a
reproduction and a check others can repeat. Share a small, reproducible improvement.

Question. Explore. Rethink.

Personal educational project; not an official OpenAI resource or an employer publication.
Use synthetic data in public examples. [MIT license](../../LICENSE).
