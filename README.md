# Beyond the Obvious AI Student Lab

Five practical AI engineering starter projects for students who want proof, not certificates.

This repository is a TypeScript monorepo for learning how production-minded AI apps are built: validation, authentication, data ownership, cost limits, upload safety, observability, evaluation, and accessible UI patterns are treated as part of the product rather than optional polish.

## Quick Start

Requirements:

- Node.js `20.11.0` or newer
- npm

Install dependencies:

```bash
npm install
```

Run the portal:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run all quality checks:

```bash
npm run verify
```

Format the repo:

```bash
npm run format
```

## Current Status

This repo currently has a working monorepo foundation:

- Shared packages are implemented and tested.
- Linting, typechecking, unit tests, formatting, builds, and project smoke evals pass.
- The portal catalogue data exists and describes all five projects.
- Each project workspace exists with Next.js, Tailwind, configuration, and a small eval runner.

Important: the five project apps do not yet have real `src/app/page.tsx` screens. They build successfully, but they currently only serve the scaffold/default 404 route. Treat the project folders as ready foundations for the actual app implementations.

## What Is Inside

```text
beyond-obvious-ai-student-lab/
  apps/
    portal/                         Main catalogue portal
  projects/
    01-knowledge-copilot/           RAG and grounded answers
    02-document-intelligence/       Document extraction and human review
    03-india-voice-assistant/       Multilingual intent and tool workflow
    04-engineering-agent/           Code review and approval workflow
    05-data-decision-assistant/     Data analysis and decision support
  packages/
    ai/                             Provider abstraction, prompts, eval framework
    auth/                           Dev auth and Firebase-ready auth interfaces
    database/                       Memory database and Firestore-ready interfaces
    observability/                  Logging, spans, token/cost metering
    shared/                         Errors, ids, result helpers, text helpers
    ui/                             Shared styles and React UI primitives
    validation/                     Env, HTTP, upload, and schema validation
  docs/
    architecture/                   Placeholder for architecture notes
    deployment/                     Placeholder for deployment notes
    interview-guide/                Placeholder for interview prep
    learning-path/                  Placeholder for learning path notes
  test/
    setup.ts                        Test setup
```

## The Five Projects

| Project                            |   Port | Goal                                                                                                       |
| ---------------------------------- | -----: | ---------------------------------------------------------------------------------------------------------- |
| AI Knowledge Copilot               | `3001` | Upload documents, retrieve relevant chunks, answer only from evidence, and cite sources.                   |
| Document Intelligence              | `3002` | Extract typed fields from invoices/documents, validate them, and route uncertain data to review.           |
| India Multilingual Voice Assistant | `3003` | Handle voice/text requests in multiple languages, extract intent and slots, and confirm before tool calls. |
| Software Engineering Agent         | `3004` | Review code with deterministic rules plus an AI pass, then propose fixes behind human approval.            |
| Data Decision Assistant            | `3005` | Import CSV data, detect anomalies, separate observations from interpretations, and track decisions.        |

Run a project app:

```bash
npm run dev:01
npm run dev:02
npm run dev:03
npm run dev:04
npm run dev:05
```

## Scripts

| Command                | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Starts the portal on port `3000`.               |
| `npm run dev:01`       | Starts project 01 on port `3001`.               |
| `npm run dev:02`       | Starts project 02 on port `3002`.               |
| `npm run dev:03`       | Starts project 03 on port `3003`.               |
| `npm run dev:04`       | Starts project 04 on port `3004`.               |
| `npm run dev:05`       | Starts project 05 on port `3005`.               |
| `npm run build`        | Builds every workspace that has a build script. |
| `npm run lint`         | Runs ESLint with zero warnings allowed.         |
| `npm run typecheck`    | Runs TypeScript across the monorepo.            |
| `npm run test`         | Runs unit tests with Vitest.                    |
| `npm run eval`         | Runs each project eval script.                  |
| `npm run verify`       | Runs lint, typecheck, tests, and evals.         |
| `npm run format`       | Formats files with Prettier.                    |
| `npm run format:check` | Checks formatting without changing files.       |
| `npm run e2e`          | Runs Playwright tests.                          |

## Environment Setup

The repo is designed to run without paid services by default.

Copy the example environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

The important defaults:

| Setting            | Default       | Meaning                                                |
| ------------------ | ------------- | ------------------------------------------------------ |
| `AI_MODE`          | `mock`        | Uses deterministic mock AI. No key, network, or cost.  |
| `DB_MODE`          | `memory`      | Uses an in-process database wiped on restart.          |
| `AUTH_MODE`        | `dev`         | Uses signed-cookie dev auth with no external provider. |
| `SESSION_SECRET`   | example value | Replace with a long random value for local use.        |
| `MAX_UPLOAD_BYTES` | `5242880`     | Upload size cap, currently 5 MB.                       |

For live AI calls:

1. Set `AI_MODE=live`.
2. Add `GEMINI_API_KEY`.
3. Keep the key server-side only. Do not create a `NEXT_PUBLIC_GEMINI_API_KEY`.

For Firebase:

1. Set `DB_MODE=firebase` and/or `AUTH_MODE=firebase`.
2. Provide the Firebase project and service account values listed in `.env.example`.
3. Never commit service account JSON or private keys.

## Design Principles

This repo is intentionally stricter than many tutorials.

- Validate inputs before spending AI tokens.
- Keep secrets on the server.
- Treat uploaded files and document text as untrusted input.
- Require ownership checks on stored records.
- Use deterministic mock mode so students can run tests and evals for free.
- Measure AI behavior with evals instead of judging by a single nice demo.
- Keep human approval around risky state changes.
- Make accessibility and error states part of the baseline.

## Shared Packages

### `@lab/ai`

Provides the AI provider abstraction, mock provider, prompt helpers, retry handling, embedding helpers, tool selection helpers, and the small evaluation framework used by the project eval scripts.

Use this package instead of importing vendor SDKs directly from app code.

### `@lab/auth`

Provides auth interfaces, a development auth provider, Firebase-ready provider boundaries, session handling helpers, and rate-limit-aware route patterns.

### `@lab/database`

Provides database interfaces, an in-memory implementation for local development, and Firestore-ready boundaries.

### `@lab/observability`

Provides logging, lightweight spans, redaction helpers, latency summaries, and token/cost metering.

### `@lab/shared`

Provides shared application errors, result types, ids, and text utilities.

### `@lab/ui`

Provides shared Tailwind tokens, base styles, and React primitives used by app workspaces.

### `@lab/validation`

Provides environment loading, HTTP helpers, upload validation, and related schemas.

## Evaluation

Each project has an `evals/run.ts` script. These are currently deterministic smoke evals that prove the shared eval framework is wired correctly and CI can fail on missed thresholds.

Run all evals:

```bash
npm run eval
```

A good future project implementation should expand these smoke evals into real behavioral evals, such as:

- Retrieval recall and citation validity for the knowledge copilot.
- Per-field extraction accuracy for document intelligence.
- Tool-selection and slot-filling accuracy for the voice assistant.
- False-positive rate for the engineering agent.
- Evidence validity and explanation quality for the data assistant.

## Testing

Run unit tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run coverage:

```bash
npm run test:coverage
```

The test suite currently covers the shared packages: validation, auth, database, AI helpers, observability, and shared result helpers.

## Building

Build all workspaces:

```bash
npm run build
```

Next.js may generate or update `next-env.d.ts` and `.next/types` during the first build of each app. That is normal.

## Recommended Student Workflow

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Keep `AI_MODE=mock` while learning.
4. Run `npm run verify` before making changes.
5. Pick one project folder under `projects/`.
6. Build the smallest working vertical slice.
7. Add or improve eval cases before relying on model output.
8. Run `npm run verify` again.
9. Only then switch to live AI mode if needed.

## Implementation Roadmap

Good next steps:

1. Add real `src/app/layout.tsx` and `src/app/page.tsx` screens for each project.
2. Connect project UIs to the shared packages.
3. Add API route handlers with auth, validation, logging, and cost limits.
4. Replace smoke evals with real task evals.
5. Add Playwright journeys once UI exists.
6. Fill the docs folders with architecture, deployment, interview guide, and learning path material.

## Troubleshooting

### `Cannot find module 'next'`

Run:

```bash
npm install
```

This usually means dependencies were not installed after workspace package files were created or changed.

### Project app builds but shows 404

That is expected right now. The project workspaces do not yet have real `page.tsx` files.

### `SESSION_SECRET` error

Set a long local secret in `.env.local`.

Example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Live AI mode fails

Check:

- `AI_MODE=live`
- `GEMINI_API_KEY` is set
- The key is not prefixed with `NEXT_PUBLIC_`
- The model names in `.env.local` are valid for your account

### Firebase mode fails

Check:

- `DB_MODE=firebase` and/or `AUTH_MODE=firebase`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Keep the literal `\n` escapes in the private key value. The environment loader converts them.

## License

MIT. See [LICENSE](./LICENSE).
