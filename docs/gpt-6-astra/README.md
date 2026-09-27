# GPT-6 Astra — Practical Reasoning & Context Guide

A practical, IT-centric learning module for the **Beyond the Obvious AI Student Lab**.

This guide teaches how to get stronger results from GPT-6 Astra without trying to expose or reproduce hidden chain-of-thought. The focus is on the parts users can control:

- task framing
- context selection
- constraints
- output contracts
- verification
- tool use
- reasoning effort
- iteration and evaluation

## Current model facts

According to OpenAI's current model documentation, `gpt-6-astra` is positioned for hard end-to-end work including complex reasoning, coding, research, computer use, and document creation. It supports reasoning effort values `low`, `medium`, `high`, `xhigh`, and `max`, and OpenAI recommends the Responses API for reasoning workloads.

> Always verify current model limits and API behavior against the official OpenAI docs before production use. Model capabilities, pricing and interfaces can change.

## The core idea

Do **not** ask the model to dump its hidden reasoning or to "think step by step". Instead give it:

1. **Goal** — what outcome you need.
2. **Context** — only the evidence and background that matter.
3. **Constraints** — technology, policy, time, budget, security, compatibility.
4. **Success criteria** — what "done" means.
5. **Verification** — tests, citations, checks, edge cases, counterexamples.
6. **Output contract** — exact structure you want back.
7. **Reasoning effort** — match effort to task difficulty instead of always choosing max.

## Suggested learning path

1. Read [`CHEATSHEET.md`](./CHEATSHEET.md).
2. Run through [`10-LIVE-DEMO-PROMPTS.md`](./10-LIVE-DEMO-PROMPTS.md).
3. Reuse templates in [`MASTER-PROMPTS.md`](./MASTER-PROMPTS.md).
4. Inspect the task router example in [`../../examples/gpt-6-astra/astra-prompt-router.ts`](../../examples/gpt-6-astra/astra-prompt-router.ts).

## Enterprise safety note

Never paste confidential company source code, internal credentials, customer data, non-public architecture, security incidents, proprietary documents, contracts, private employee data, or unreleased roadmap information into a public or unapproved AI workflow. Replace real identifiers with synthetic examples and follow your organization's approved AI/data-handling policy.

## Public-content disclaimer

Personal perspectives on technology, AI, careers and the digital future. Views expressed are my own and do not represent my employer or any organization I am associated with.

## License

Use under the repository's MIT license.
