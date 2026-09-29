# Run locally and prepare a deployment

## Local learning

```bash
npm ci
npm run dev
```

The portal and prompt lab work without credentials. The five project apps currently
serve scaffold routes; add a real page and workflow before expecting a product demo.

Next.js reads environment files from the app workspace. If you need overrides for
the portal, run this from the repository root:

```bash
cp .env.example apps/portal/.env.local
```

For a project app, copy the root `.env.example` to `.env.local` inside that project
folder instead. A root `.env.local` is not automatically loaded by these workspace
commands. CLI scripts need environment variables supplied by the shell or their runner.

## Validate a build

```bash
npm run verify
npm run build
npm run e2e -- --project=portal
```

Install the Playwright Chromium browser first with `npx playwright install chromium`.
Build success alone does not prove that a scaffold is a working application.

## Before serving real users

Use a platform that supports the selected Next.js app. Build from the monorepo root so
workspace packages resolve, and configure the host's start command and secrets for that
workspace. Do not put credentials in `NEXT_PUBLIC_*` values or commit environment files.

Implement production auth and durable storage, authorization on every data path, input
and upload validation, rate/spend limits, timeout/error recovery, monitoring and a rollback
plan. Use a fresh session secret. Validate optional Firebase or AI providers separately;
the mock path passing does not verify external integrations or account/model availability.

The prompt lab itself needs no live provider. Hosting a public catalogue does not require
turning on paid AI requests.
