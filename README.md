# FinPilot AI

FinPilot AI is a privacy-conscious personal-finance application for tracking income, consumption expenses, internal transfers, refunds, investment contributions, budgets, subscriptions, and goals. INR, `en-IN`, and `Asia/Kolkata` are the defaults, while currency, locale, timezone, and financial-month boundaries remain configurable.

The application is being built as a modular Next.js monolith. Financial truth comes from deterministic TypeScript services and PostgreSQL decimal values; optional AI only explains already-calculated analytics.

## Current implementation

- Passwordless Auth.js email login with revocable database sessions
- User-scoped Prisma schema covering auth, profiles, accounts, transactions, budgets, recurring rules, subscriptions, goals, holdings, imports, insights, notifications, and audit logs
- Account creation and transaction entry with server-side ownership and category validation
- Correct separation of income, expenses, refunds, transfers, and investments
- Database-backed current-month dashboard and transaction ledger
- Timezone-aware financial-month boundaries
- Deterministic anomaly, planning, subscription, and health-score calculations
- Opt-in AI preference, detailed aggregate-only analytics, strict Zod output, and server-only Google Gemini Interactions API adapter
- Dedicated AI Insights dashboard with six-month cash flow, category allocation, spending flexibility, budget pressure, forecasts, and evidence-backed saving scenarios
- On-demand AI reviews with consent checks, database-backed per-user limits, identical-report caching, and monetary-claim safeguards
- Seeded system categories and four months of safe demonstration data
- Responsive light/dark application shell and passwordless onboarding entry
- Pinned dependencies, hardened Docker services, CI, CodeQL, Dependabot, strict TypeScript, linting, and security tests

The remaining MVP modules are tracked by the implementation order in the build brief: expanded onboarding, editing/deletion/restore, budget and recurring UIs, reports, CSV preview/commit/export, scheduled jobs, notifications, data export/deletion, and full integration/E2E coverage.

## Architecture

```text
Browser
  -> Next.js App Router
       -> Auth.js database sessions
       -> Server actions and route handlers
       -> User-scoped domain services
       -> Deterministic analytics engine
       -> Prisma ORM 7 + PostgreSQL
       -> Optional server-only Google Gemini Interactions API
```

Business logic lives under `modules/`; route files compose services and views. Persisted money uses PostgreSQL `Decimal(18,2)`. Browser input is parsed from strings and authoritative arithmetic uses `decimal.js`.

## Screenshots

Screenshots will be added after the complete MVP routes are implemented and the Playwright visual pass is stable.

## Prerequisites

- Node.js 22.12 or newer (22.23 recommended)
- pnpm 11.20
- Docker with Compose, or PostgreSQL 14+

## Local setup

```bash
cp .env.example .env
# Replace all placeholders in .env before continuing.
docker compose up -d postgres mailpit
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Open the application at `http://localhost:3000` and the local email inbox at `http://localhost:8025`. Enter any development email on the login page, then open its one-time link in Mailpit. The seed user is `demo@finpilot.local`; it has no password and cannot bypass email authentication.

To run the application itself in Docker after migrations are applied:

```bash
docker compose --profile app up --build
```

## Environment variables

Copy `.env.example`; it documents all variables. Local essentials are:

- `DATABASE_URL`: PostgreSQL connection used by Prisma
- `AUTH_SECRET`: random value of at least 32 characters
- `NEXTAUTH_URL`: canonical application URL; use HTTPS outside localhost
- `EMAIL_SERVER` and `EMAIL_FROM`: passwordless email transport
- `AI_PROVIDER`: provider selector; currently `gemini`
- `AI_MONTHLY_USER_REQUEST_LIMIT` and `AI_MAX_OUTPUT_TOKENS`: per-user usage and response limits
- `GEMINI_API_KEY` and `GEMINI_MODEL`: optional, server-only Gemini configuration

Never prefix Gemini credentials with `NEXT_PUBLIC_`.

Generate an authentication secret without placing it in shell history:

```bash
openssl rand -base64 32
```

Store the result in your deployment secret manager or ignored local `.env`, not
in source control. Docker Compose is intended only for local development and
requires `POSTGRES_PASSWORD` in the ignored `.env`; its database and Mailpit
ports bind to loopback only.

## Configure Gemini

AI insights remain optional and disabled per user until explicit consent. To enable Gemini locally:

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to `.env` if you have not already done so.
3. Set `GEMINI_API_KEY` in `.env`. Keep it server-only and never commit it.
4. Keep `AI_PROVIDER=gemini`. The default model is `gemini-3.5-flash-lite`; override `GEMINI_MODEL` only with a compatible model that supports structured output.
5. Never prefix the API key with `NEXT_PUBLIC_`.
6. Restart the development server after changing `.env`.
7. Open **Settings** and enable AI insights for the signed-in user.
8. Verify the connection with a synthetic aggregate-only request:

```bash
pnpm ai:verify
```

To exercise the prompt against the three synthetic acceptance profiles—high food delivery, an efficient saver, and subscription-heavy spending—run:

```bash
pnpm ai:verify:profiles
```

> Development privacy warning: Use synthetic or anonymised finance data while testing with a free hosted AI tier. Do not use real bank-account numbers, card details, UPI identifiers, credentials, or complete financial statements.

Running `pnpm ai:verify` sends only a built-in synthetic financial summary to Google. Generating an insight in the application sends filtered aggregate financial metrics and allow-listed evidence to Google Gemini. It does not send email, account identifiers or labels, raw transaction descriptions, notes, authentication data, or uploaded files.

The integration uses the official [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK, the [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview), and [structured output](https://ai.google.dev/gemini-api/docs/structured-output). See the [Gemini API documentation](https://ai.google.dev/gemini-api/docs), [models](https://ai.google.dev/gemini-api/docs/models), and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) before changing production configuration.

## Database and seed

```bash
pnpm prisma validate
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm prisma studio
```

The seed creates system categories plus a synthetic user with ₹80,000 salary, recurring living costs, an ₹8,000 SIP, accounts, budgets, a subscription, a holding, and an emergency-fund goal. It contains no real credentials or personal details.

## Quality commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
pnpm security:secrets
pnpm security:audit
pnpm security:check
```

`pnpm security:check` runs the offline secret scan, formatting, linting,
type-checking, unit tests, and production build. `pnpm security:audit` requires
registry access and should also run in CI or before every release.

Tests cover decimal money and database bounds, counting rules, refunds, transfer and investment exclusion, zero-income handling, budgets, subscriptions, goals, emergency coverage, month boundaries, robust anomalies, health scoring, CSV injection protection, import fingerprints, authentication/ownership boundaries, database-backed rate limiting, CSP behavior, environment validation, AI privacy filtering, structured output validation, and the three synthetic Gemini insight profiles.

## AI privacy model

AI is off by default. Enabling it records explicit consent. The server builds a compact payload of verified totals, category shares and previous-month changes, food subcategories, subscription monthly equivalents and usage status, budgets, and allow-listed opportunity evidence. It omits identity, email, account labels/identifiers, merchants, raw descriptions, notes, authentication data, and uploaded files. User-defined analytics labels are length-limited and screened for identifiers and common instruction-injection patterns. The Gemini Interactions API request uses strict structured output and `store: false`; invalid or unavailable commentary never blocks the underlying dashboard.

Expense essentiality can be overridden under **Settings → Expense context for AI**. These overrides affect explanation and recommendation wording only; they never alter deterministic transaction totals.

## Security notes

- Every protected page and mutation resolves the authenticated server session.
- Ownership is filtered in the database query; client-supplied `userId` values are never authoritative.
- Financial mutations validate linked accounts and categories before a database transaction.
- Magic-link and Gemini requests use hashed-subject, database-backed rate limits that work across server instances.
- Account identifiers are limited to an optional last four digits.
- Audit entries contain only safe event metadata, not transaction descriptions or tokens.
- A per-request nonce CSP restricts scripts; private pages are marked `private, no-store`.
- Headers disable framing, MIME sniffing, cross-origin resource use, and unnecessary browser capabilities. Production adds HSTS.
- NextAuth provides CSRF-validated POST flows and secure, HTTP-only, SameSite cookies when `NEXTAUTH_URL` uses HTTPS.
- The application does not enable cross-origin API access; authenticated data remains same-origin.

## Deployment

Build the standalone image with `docker build .`, or deploy to a Node-compatible platform such as Vercel. Use a managed PostgreSQL database and configure production email. Set `NODE_ENV=production`, an HTTPS `NEXTAUTH_URL`, a securely generated `AUTH_SECRET`, `DATABASE_URL`, `EMAIL_SERVER`, and `EMAIL_FROM`. Apply checked-in migrations with `pnpm prisma migrate deploy` as a controlled release step; never run `migrate dev` against production.

Verify a production build and start locally before deployment:

```bash
pnpm build
pnpm start
```

Before launch, enable database backups and test restoration, verify secure cookies over HTTPS, review Gemini project quotas if AI is enabled, and establish a documented process for data-access/deletion requests. Monitoring must never receive transaction contents, credentials, or raw Gemini payloads.

## GitHub repository security

CI validates secrets, formatting, linting, types, migrations, tests, dependency vulnerabilities, and the production build. Dependabot checks npm, Docker, and GitHub Actions weekly; CodeQL scans JavaScript and TypeScript.

After creating the GitHub repository, enable Secret Scanning and Push Protection,
Dependabot Alerts and Security Updates, Code Scanning, private vulnerability
reporting, and branch protection requiring the CI and CodeQL checks. Grant
workflows only the permissions already declared in their YAML files. See
[`SECURITY.md`](SECURITY.md) for responsible reporting.

## Backup and restore

Use provider snapshots plus periodic logical backups. Test restoration into an isolated database, run `pnpm prisma migrate deploy`, and verify `/api/health`. Never restore production data into local development.

## Troubleshooting

- **Node engine error:** use Node 22.12+; Node 18 cannot run the pinned Next.js/Prisma toolchain.
- **No sign-in email:** verify Mailpit is running, `EMAIL_SERVER=smtp://localhost:1025`, and inspect `http://localhost:8025`.
- **Database unavailable:** run `docker compose ps`, then verify `DATABASE_URL` and the PostgreSQL health check.
- **AI unavailable:** this is non-blocking; verify explicit consent, `AI_PROVIDER`, `GEMINI_API_KEY`, and `GEMINI_MODEL`. Run `pnpm ai:verify` to test configuration without user data.

## Known limitations and roadmap

The current vertical slice intentionally precedes the rest of the required MVP. Bank credential storage, automated transfers/trades, and unverified AI calculations are out of scope by design. Later architecture-ready modules include receipt OCR, compliant account aggregation, household budgets, debt planning, PWA capture, and allow-listed “Ask My Finances” tools.
