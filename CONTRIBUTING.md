# Contributing

Welcome. A clear correction, a useful test, or a reviewed translation can be as valuable
as a new feature. Start with [Community](COMMUNITY.md) and the [learning path](docs/learning-path/README.md).

## Local setup

1. Fork the repo, clone your fork and create a branch for one focused change.
2. Use Node.js 22 or 24 and npm. Run `npm ci` from the repository root.
3. Run `npm run verify` and `npm run dev`. The default learning path needs no API keys.
4. Read the status in the [README](README.md): the five project apps are scaffolds.

## A useful pull request

Explain the learner problem, the resulting behavior, and exactly what you checked.
Keep unrelated refactors out of the change. Use synthetic examples and keep credentials,
personal records and employer material out of issues, commits and screenshots.

For code changes, run:

```bash
npm run verify
npm run build
```

For portal behavior, also run:

```bash
npx playwright install chromium
npm run e2e -- --project=portal
```

For documentation-only changes, `npm run docs:check` and formatting the changed files
are usually enough locally; CI runs the repository gates. Format only your changed files
with `npx prettier --write path/to/file`, then use `npm run format:check` for the final check.

## Add or improve an Astra exercise

1. Edit [the shared scenario source](examples/gpt-6-astra/scenarios.ts); both portal and CLI read it.
2. Supply a stable ID, India/Global context, synthetic fixture, objective, constraints,
   success criteria, verification steps, four review checks and a stretch exercise.
3. Keep the complete prompt small enough to inspect. Avoid fake model answers or unsupported speed/cost claims.
4. Update [the demo index](docs/gpt-6-astra/10-LIVE-DEMO-PROMPTS.md), counts and integrity tests if the catalogue intentionally grows.
5. Run `npm run astra:docs` to synchronize the GitHub-readable prompts, then `npm run astra:check`; verify text and JSON CLI output and the portal.
6. For measured AI claims, follow [the evaluation workbook](docs/gpt-6-astra/EVALUATION.md).

## Translation and source quality

Propose companion language files instead of replacing the English source. Keep code,
identifiers, units and acceptance criteria unchanged. Credit a reviewer only with their
permission. Add primary-source links and an observation date for model/API claims.
Do not assume a regulation applies to an educational scenario.

## Review expectations

Maintainers assess correctness, clarity, accessibility, scope and reproducibility. A
passing automated check is supporting evidence, not a guarantee of correctness. There
is no promised review SLA. Be patient and follow the [Code of Conduct](CODE_OF_CONDUCT.md).
Contributions are distributed under the repository's [MIT license](LICENSE).
