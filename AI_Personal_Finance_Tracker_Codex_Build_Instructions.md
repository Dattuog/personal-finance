# FinPilot AI — End-to-End Codex Build Instructions

> **Purpose:** Give this entire file to Codex and ask it to build the application completely.  
> **Working title:** FinPilot AI  
> **Primary currency:** INR (`₹`)  
> **Application type:** Secure, responsive, production-ready personal finance web application

---

## 1. Codex Role and Non-Negotiable Instructions

Act as a senior full-stack engineer, product engineer, database designer, security engineer, and test engineer.

Build a complete, functioning personal finance application named **FinPilot AI**. Do not stop after scaffolding, mock screens, wireframes, or partial CRUD. Implement the frontend, backend, database, authentication, analytics, AI integration, tests, Docker setup, seed data, and deployment documentation.

### Mandatory engineering rules

1. Use the latest stable versions of all dependencies that are compatible with each other. Pin versions in the lockfile.
2. Use TypeScript in strict mode. Do not use `any` unless there is a documented, unavoidable interoperability reason.
3. Use server-side authorization for every protected operation. Hiding a UI button is not authorization.
4. Every user-owned database record must include a `userId`, directly or through a securely verified parent relation.
5. Never trust IDs, totals, category names, dates, currencies, or ownership information received from the browser.
6. Store monetary values as database decimals, never JavaScript floating-point numbers for persisted or authoritative calculations.
7. Perform all authoritative financial calculations in deterministic application code. The AI may explain calculated results, but it must not invent totals or perform the final accounting calculations.
8. The Gemini API key must only exist on the server. Never expose it through browser code, public environment variables, logs, error messages, or source control.
9. Do not store real bank login credentials. The first version must use manual entry and CSV import. Bank integration is a future module.
10. Do not implement automated investing, trading, fund transfers, or bill payments.
11. Do not leave `TODO`, `FIXME`, placeholder buttons, dead routes, fake charts, or non-working forms in required MVP features.
12. All forms require schema validation, helpful errors, loading states, empty states, and success feedback.
13. Run formatting, linting, type checking, unit tests, integration tests, and end-to-end tests before considering the project complete.
14. Create a detailed root `README.md` containing setup, architecture, scripts, environment variables, test commands, deployment instructions, and screenshots placeholders.
15. Prefer simple, maintainable code over unnecessary abstractions or microservices.

---

## 2. Product Goal

The user receives one or more sources of monthly income and spends money on items such as:

- Food and groceries
- House rent
- Electricity, water, gas, internet, and phone bills
- Travel and transport
- AI and software subscriptions
- Shopping and entertainment
- Healthcare
- Money sent to family
- Loan or credit-card payments
- Mutual-fund or other investments
- Emergency savings
- Other personal expenses

The application must show:

- How much money was earned
- How much was consumed as expenses
- How much was invested
- How much was transferred between the user's own accounts
- How much remains available
- Which categories consume the most money
- Whether spending is increasing or decreasing
- Which budgets are at risk
- Which subscriptions or recurring costs may be reduced
- How much the user is saving and investing
- Whether financial goals are on track
- Specific, evidence-based opportunities to save money

The product must help the user understand and improve financial behaviour without pretending to be a regulated financial adviser.

---

## 3. Scope

## 3.1 Required MVP

Implement all of the following:

1. Secure signup, login, logout, session management, password reset or magic-link flow, and protected routes.
2. Guided onboarding for currency, timezone, monthly income, account setup, fixed expenses, financial goals, and preferred budget style.
3. Account management for bank accounts, cash, wallets, credit cards, and investment accounts.
4. Income, expense, transfer, refund, and investment transaction tracking.
5. Categories and subcategories with essential/discretionary and fixed/variable classifications.
6. Recurring salary, rent, bills, subscriptions, SIPs, family support, and other recurring transactions.
7. Monthly and category budgets.
8. Subscription tracker with renewal dates and monthly-equivalent cost.
9. Savings goals and emergency-fund tracking.
10. Basic investment-contribution tracking for mutual funds and similar investments.
11. Dashboard with current-month financial position and comparison with previous months.
12. Transaction search, filtering, sorting, pagination, editing, and deletion.
13. CSV import with preview, column mapping, validation, duplicate detection, and import summary.
14. CSV export and full user-data export.
15. Deterministic analytics and financial health metrics.
16. AI-generated monthly insights based only on server-calculated analytics.
17. Reports for cash flow, category spending, budgets, subscriptions, savings, and investments.
18. Notifications inside the application for upcoming recurring bills, budget thresholds, unusual spending, and goal progress.
19. User settings, profile, privacy controls, data deletion, and AI opt-in/opt-out.
20. Responsive design, dark/light theme, accessibility, robust error handling, tests, Docker, and deployment documentation.

## 3.2 Important Phase 2 Features

Design the architecture so these can be added later, but do not allow them to delay the MVP:

- Receipt image upload and OCR
- Email-based receipt parsing
- Account Aggregator or banking integration through a compliant provider
- Automatic mutual-fund NAV or stock-price updates through a licensed data provider
- Shared household budgets
- Debt payoff planner
- Tax-category reports
- Progressive Web App and offline transaction capture
- AI “Ask My Finances” chat using allow-listed server analytics tools
- Email or push notifications
- Multi-currency conversion with historical exchange rates

---

## 4. Recommended Technology Stack

Use a single full-stack application rather than separate frontend and backend repositories.

| Layer                | Technology                                                                                                 | Reason                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Full-stack framework | Next.js App Router + TypeScript                                                                            | Mature React framework with server components, route handlers, server actions, routing, and deployment support |
| UI                   | Tailwind CSS + shadcn/ui                                                                                   | Accessible, consistent, customizable components without locking the product into a heavy UI framework          |
| Forms                | React Hook Form + Zod                                                                                      | Performant forms with shared runtime validation                                                                |
| Database             | PostgreSQL                                                                                                 | Reliable relational storage, transactions, constraints, decimal support, indexing, and analytics queries       |
| ORM                  | Prisma ORM                                                                                                 | Type-safe queries, migrations, transactions, and readable schema                                               |
| Authentication       | Auth.js using a stable database-backed session strategy                                                    | Avoid custom authentication and support secure, extensible login flows                                         |
| Charts               | Recharts                                                                                                   | React-friendly responsive charts                                                                               |
| Tables               | TanStack Table                                                                                             | Filtering, sorting, pagination, and accessible transaction tables                                              |
| Dates                | date-fns                                                                                                   | Explicit date and timezone-safe utility functions                                                              |
| AI                   | Official Google GenAI JavaScript/TypeScript SDK using the Gemini Interactions API                          | Server-side structured financial explanations and recommendations                                              |
| Logging              | Pino or an equivalent structured logger                                                                    | Machine-readable logs with redaction                                                                           |
| Rate limiting        | Redis-compatible service such as Upstash Redis in production; in-memory adapter only for local development | Protect authentication, import, and AI endpoints                                                               |
| Testing              | Vitest, React Testing Library, Playwright                                                                  | Unit, component, integration, and end-to-end coverage                                                          |
| Local development    | Docker Compose with PostgreSQL                                                                             | Reproducible setup                                                                                             |
| Deployment           | Vercel or another Node-compatible host + managed PostgreSQL                                                | Straightforward deployment while preserving portability                                                        |
| Monitoring           | Sentry-compatible error monitoring, optional through an adapter                                            | Production diagnostics without coupling domain code                                                            |

### Stack constraints

- Do not use MongoDB. Financial relationships, constraints, aggregates, and transactions fit PostgreSQL better.
- Do not place financial business logic only in React components.
- Do not call Gemini directly from the browser.
- Do not make Redis mandatory for local development.
- Keep provider-specific integrations behind interfaces so hosting can be changed later.

---

## 5. High-Level Architecture

Use a modular monolith:

```text
Browser
  |
  | HTTPS
  v
Next.js Application
  |- Server-rendered pages and client components
  |- Route handlers / server actions
  |- Authentication and authorization
  |- Domain services
  |- Deterministic analytics engine
  |- Import/export service
  |- Recurring transaction service
  |- Notification service
  |- AI insight service
  |
  +---- PostgreSQL through Prisma
  |
  +---- Redis-compatible rate limiter/cache (production)
  |
  +---- Google Gemini Interactions API (server-side, opt-in)
  |
  +---- Scheduled cron endpoints protected by a secret
```

### Module boundaries

Create modules for:

- `auth`
- `users`
- `accounts`
- `categories`
- `transactions`
- `budgets`
- `recurring`
- `subscriptions`
- `goals`
- `investments`
- `analytics`
- `insights`
- `imports`
- `exports`
- `notifications`
- `audit`
- `settings`

Each module should contain its schemas, repository queries, domain service, authorization checks, and tests. Avoid a giant shared `utils.ts` or one oversized service file.

---

## 6. Core Financial Rules

These rules are critical and require unit tests.

### 6.1 Transaction types

Use the following transaction types:

- `INCOME`
- `EXPENSE`
- `TRANSFER`
- `INVESTMENT`
- `REFUND`
- `ADJUSTMENT`

### 6.2 Counting rules

1. **Income** contributes to income totals.
2. **Expense** contributes to spending totals.
3. **Transfer** between the user's own accounts does not count as income or expense.
4. **Investment contribution** is a cash outflow and wealth allocation, but not ordinary consumption spending.
5. **Refund** reduces spending in the original category and period according to the reporting rule.
6. **Credit-card payment** is a transfer from a bank account to a credit-card account, not a second expense.
7. **Credit-card purchase** is the expense. Its later payment must not duplicate it.
8. **Money sent to family** is normally an expense under `Family Support`, unless the user deliberately marks it as a recoverable transfer or loan.
9. Deleted financial records should be soft-deleted or auditable so accidental changes can be traced.
10. All reports must clearly distinguish expenses, investments, transfers, debt payments, and remaining cash.

### 6.3 Money representation

- Database type: `Decimal(18, 2)` for INR and ordinary fiat amounts.
- Store currency as ISO 4217 code, default `INR`.
- Parse user input as strings into a decimal library compatible with Prisma Decimal.
- Never use binary floating-point arithmetic for authoritative values.
- Round only at defined display or currency boundaries.
- Store percentages as decimals with explicit scale or compute them from decimal inputs.

### 6.4 Dates and timezones

- Store timestamps in UTC.
- Store a user timezone, default `Asia/Kolkata`.
- Determine month boundaries using the user's timezone, not the server timezone.
- A date-only transaction should retain its intended local calendar date.
- Test month-end, year-end, daylight-saving zones, and leap-year behaviour even though the default timezone is India.

---

## 7. Database Design

Implement the schema through Prisma migrations. Use UUIDs or CUID2 consistently. Add `createdAt`, `updatedAt`, and appropriate indexes to all major tables.

## 7.1 User and settings

### `User`

Use Auth.js-compatible user fields plus:

- `id`
- `name`
- `email` unique
- `emailVerified`
- `image`
- `createdAt`
- `updatedAt`

### `UserProfile`

- `id`
- `userId` unique
- `currencyCode` default `INR`
- `timezone` default `Asia/Kolkata`
- `locale` default `en-IN`
- `financialMonthStartDay` default `1`
- `monthlyIncomeTarget` decimal nullable
- `aiEnabled` boolean default false
- `aiConsentAt` nullable
- `onboardingCompletedAt` nullable
- `dataRetentionPreference`
- timestamps

## 7.2 Accounts

### `Account`

- `id`
- `userId`
- `name`
- `type`: `BANK`, `CASH`, `WALLET`, `CREDIT_CARD`, `INVESTMENT`, `LOAN`, `OTHER`
- `currencyCode`
- `openingBalance` decimal
- `openingBalanceDate`
- `creditLimit` decimal nullable
- `institutionName` nullable
- `lastFourDigits` nullable; never require or store full account numbers
- `isIncludedInNetWorth` boolean
- `isArchived` boolean
- timestamps

Indexes:

- `(userId, isArchived)`
- `(userId, type)`

Account balances should be derived from the opening balance and non-deleted transactions. A cached snapshot may be used, but it must be rebuildable.

## 7.3 Categories

### `Category`

- `id`
- `userId` nullable for system categories
- `name`
- `slug`
- `parentId` nullable
- `kind`: `INCOME`, `EXPENSE`, `INVESTMENT`
- `necessity`: `ESSENTIAL`, `DISCRETIONARY`, `NEUTRAL`
- `costBehaviour`: `FIXED`, `VARIABLE`, `MIXED`
- `icon`
- `displayOrder`
- `isSystem`
- `isArchived`
- timestamps

Prevent a user from editing global system categories in place. Allow a user-specific override or custom category.

Seed categories such as:

- Salary
- Freelance Income
- Bonus
- Rent
- Groceries
- Dining Out
- Electricity
- Water
- Gas
- Internet
- Mobile
- Transport
- Fuel
- Healthcare
- Insurance
- Education
- Shopping
- Entertainment
- Travel
- AI Subscriptions
- Software Subscriptions
- Family Support
- Loan Interest
- Bank Charges
- Charity
- Emergency Savings
- Mutual Funds
- Stocks
- Fixed Deposits
- Other

## 7.4 Transactions

### `Transaction`

- `id`
- `userId`
- `type`
- `amount` decimal, always positive
- `currencyCode`
- `transactionDate` date or timezone-safe timestamp
- `sourceAccountId` nullable
- `destinationAccountId` nullable
- `categoryId` nullable
- `merchant` nullable
- `description` nullable
- `notes` nullable
- `paymentMethod` nullable
- `status`: `PENDING`, `CLEARED`, `RECONCILED`
- `isRecurringGenerated` boolean
- `recurringRuleId` nullable
- `subscriptionId` nullable
- `goalId` nullable
- `parentTransactionId` nullable for refunds/reversals
- `importFingerprint` nullable
- `importJobId` nullable
- `metadata` JSON nullable, with a documented allow-list
- `deletedAt` nullable
- timestamps

Validation rules:

- `INCOME`: destination account and income category required.
- `EXPENSE`: source account and expense category required.
- `TRANSFER`: source and destination required, must be different, category normally null.
- `INVESTMENT`: source account and destination investment account required, investment category required.
- `REFUND`: destination account required; parent transaction recommended.
- User must own every referenced account, category, subscription, goal, recurring rule, and parent transaction.
- Reject zero and negative amounts.

Indexes:

- `(userId, transactionDate)`
- `(userId, type, transactionDate)`
- `(userId, categoryId, transactionDate)`
- `(userId, sourceAccountId, transactionDate)`
- `(userId, destinationAccountId, transactionDate)`
- unique partial strategy for `(userId, importFingerprint)` where appropriate

## 7.5 Budgets

### `Budget`

- `id`
- `userId`
- `name`
- `period`: `MONTHLY`, `WEEKLY`, `CUSTOM`
- `startDate`
- `endDate` nullable
- `amount` decimal
- `currencyCode`
- `categoryId` nullable for overall budget
- `rolloverEnabled` boolean
- `alertThresholdPercent` default 80
- `isActive`
- timestamps

Support both an overall monthly spending budget and category budgets. Investment allocations should use a separate target rather than being counted as expense-budget usage.

## 7.6 Recurring rules

### `RecurringRule`

- `id`
- `userId`
- `name`
- transaction template fields
- `frequency`: `DAILY`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`
- `interval` integer default 1
- `dayOfMonth` nullable
- `dayOfWeek` nullable
- `startDate`
- `endDate` nullable
- `nextRunAt`
- `autoCreate` boolean
- `requiresConfirmation` boolean
- `isActive`
- timestamps

Ensure scheduled execution is idempotent. Add a unique occurrence key so the same recurring transaction cannot be generated twice.

### `RecurringOccurrence`

- `id`
- `recurringRuleId`
- `scheduledFor`
- `transactionId` nullable
- `status`: `PENDING`, `CREATED`, `SKIPPED`, `FAILED`
- `errorCode` nullable
- unique `(recurringRuleId, scheduledFor)`
- timestamps

## 7.7 Subscriptions

### `Subscription`

- `id`
- `userId`
- `name`
- `vendor`
- `categoryId`
- `sourceAccountId`
- `amount` decimal
- `currencyCode`
- `billingFrequency`: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`
- `nextRenewalDate`
- `trialEndDate` nullable
- `lastUsedAt` nullable
- `isEssential`
- `status`: `ACTIVE`, `PAUSED`, `CANCELLED`, `TRIAL`
- `cancellationUrl` nullable
- `notes` nullable
- timestamps

Calculate monthly-equivalent cost deterministically.

## 7.8 Goals

### `Goal`

- `id`
- `userId`
- `name`
- `type`: `EMERGENCY_FUND`, `PURCHASE`, `TRAVEL`, `EDUCATION`, `DEBT_PAYOFF`, `OTHER`
- `targetAmount` decimal
- `currentAmount` decimal or derive from linked transactions
- `targetDate` nullable
- `priority`: `LOW`, `MEDIUM`, `HIGH`
- `linkedAccountId` nullable
- `status`: `ACTIVE`, `COMPLETED`, `PAUSED`, `CANCELLED`
- timestamps

Provide required monthly contribution and progress percentage. Do not show impossible or negative contribution values without explaining the condition.

## 7.9 Investments

### `InvestmentHolding`

- `id`
- `userId`
- `accountId`
- `name`
- `assetType`: `MUTUAL_FUND`, `STOCK`, `ETF`, `FIXED_DEPOSIT`, `GOLD`, `CRYPTO`, `OTHER`
- `symbolOrCode` nullable
- `units` decimal nullable
- `averageCost` decimal nullable
- `currentPrice` decimal nullable
- `investedAmount` decimal
- `currentValue` decimal nullable
- `valuationAsOf` nullable
- `isArchived`
- timestamps

### `InvestmentContribution`

- `id`
- `userId`
- `holdingId`
- `transactionId` unique
- `amount` decimal
- `units` decimal nullable
- `pricePerUnit` decimal nullable
- `contributionDate`
- timestamps

For MVP, manual valuation is acceptable. Clearly label stale valuation dates.

## 7.10 Insights and snapshots

### `MonthlySnapshot`

Store reproducible monthly calculated metrics:

- `id`
- `userId`
- `month` normalized to first day
- income
- expenses
- investments
- transfers
- refunds
- essential expenses
- discretionary expenses
- fixed expenses
- variable expenses
- family support
- subscription cost
- cash surplus
- savings rate
- investment rate
- net-worth estimate
- emergency-fund months
- health-score components JSON
- calculation version
- timestamps
- unique `(userId, month)`

### `InsightReport`

- `id`
- `userId`
- `periodStart`
- `periodEnd`
- `reportType`: `MONTHLY`, `ON_DEMAND`, `BUDGET_WARNING`, `SUBSCRIPTION_REVIEW`
- `analyticsVersion`
- `promptVersion`
- `inputHash`
- `provider`
- `model`
- `structuredOutput` JSON
- `tokenUsage` JSON nullable
- `estimatedApiCost` decimal nullable
- `status`
- `errorCode` nullable
- `generatedAt`
- timestamps

Do not store the Gemini API key, raw authentication tokens, complete account identifiers, or unnecessary personally identifiable information.

## 7.11 Imports, notifications, and audit

### `ImportJob`

- file name
- file hash
- status
- total rows
- imported rows
- skipped rows
- failed rows
- mapping JSON
- error summary JSON
- timestamps

### `Notification`

- userId
- type
- title
- message
- severity
- actionUrl nullable
- readAt nullable
- expiresAt nullable
- deduplicationKey nullable
- timestamps

### `AuditLog`

- userId nullable
- event type
- entity type
- entity ID nullable
- action
- safe metadata JSON
- IP hash or coarse security metadata where lawful and useful
- timestamp

Never store passwords, session tokens, API keys, raw CSV contents, full financial descriptions, or sensitive request bodies in audit logs.

---

## 8. Application Pages and UX

## 8.1 Public pages

- `/` — concise product landing page
- `/login`
- `/signup`
- `/forgot-password`
- `/privacy`
- `/terms`

## 8.2 Onboarding

Route: `/onboarding`

Steps:

1. Name, currency, locale, timezone
2. Add primary bank/cash account and opening balance
3. Add monthly income or recurring income sources
4. Add rent, utilities, subscriptions, SIPs, and family support
5. Choose monthly overall budget and optional category budgets
6. Create an emergency-fund or savings goal
7. Explain AI privacy and request explicit opt-in
8. Review and finish

Allow skipping optional steps and editing later. Save progress after each step.

## 8.3 Authenticated navigation

Desktop sidebar and mobile bottom navigation:

- Overview
- Transactions
- Accounts
- Budgets
- Recurring
- Subscriptions
- Investments
- Goals
- Insights
- Reports
- Notifications
- Settings

## 8.4 Dashboard

Route: `/dashboard`

Required widgets:

1. Month selector
2. Total income
3. Total expenses
4. Total invested
5. Cash surplus
6. Available balance estimate
7. Savings rate
8. Budget remaining
9. Net-worth estimate
10. Income versus expense trend
11. Category spending chart
12. Essential versus discretionary split
13. Fixed versus variable split
14. Budget progress bars
15. Upcoming bills and subscriptions
16. Recent transactions
17. Goal progress
18. Unusual spending alerts
19. AI insight summary, only when enabled

Every card must include a clear definition or tooltip so the user understands how the number is calculated.

## 8.5 Transactions

Route: `/transactions`

Features:

- Add, edit, duplicate, soft-delete, and restore where appropriate
- Quick-add drawer
- Filters by date, amount, account, category, type, merchant, and status
- Full-text search over safe transaction fields
- Sort and server-side pagination
- Bulk category update
- CSV import and export
- Detail view showing account impacts
- Correct transfer, credit-card payment, investment, and refund labelling

## 8.6 Budgets

Route: `/budgets`

- Overall monthly budget
- Category budgets
- Spent, remaining, forecast, and percentage used
- Threshold notifications at configurable percentages
- Month-to-month comparison
- Optional rollover
- Do not count investments or transfers as expense-budget consumption

## 8.7 Subscriptions

Route: `/subscriptions`

- Active recurring subscriptions
- Monthly-equivalent total
- Upcoming renewals
- Annualized cost
- Last-used field
- Essential/non-essential flag
- “Review” suggestions based on cost and usage, not automatic cancellation

## 8.8 Investments

Route: `/investments`

- Total contributions
- Current value when entered
- Gain/loss only when valuation data exists
- Contributions by month
- SIP schedule
- Holdings list
- Stale-price warning
- Investments must remain separate from normal spending charts

## 8.9 Goals

Route: `/goals`

- Progress bar
- Required monthly contribution
- Target date
- Linked account or contributions
- Emergency-fund goal measured in months of essential expenses
- Scenario indicating how reducing selected discretionary categories changes the completion date

## 8.10 Insights

Route: `/insights`

Tabs:

- Monthly review
- Savings opportunities
- Budget risks
- Subscription review
- Spending anomalies
- Cash-flow forecast
- Methodology

Display the evidence and calculation behind every AI suggestion. The user must be able to dismiss, save, or mark a suggestion as acted upon.

## 8.11 Reports

Route: `/reports`

- Monthly cash-flow report
- Category report
- Budget variance report
- Subscription report
- Savings and investment report
- Net-worth trend
- Custom date range
- CSV export
- Printable report layout

## 8.12 Settings and privacy

Route: `/settings`

- Profile
- Currency and timezone
- Financial month start
- Theme
- Notification preferences
- AI opt-in/opt-out
- Export all data
- Delete account and data
- Session management
- Security settings

---

## 9. Deterministic Analytics Engine

Create a pure, testable analytics layer. It must accept normalized transaction/account/budget data and return typed result objects without calling Gemini.

## 9.1 Required metrics

Calculate:

- Total income
- Total expenses
- Total refunds
- Net expenses
- Total investments
- Total internal transfers
- Cash surplus before investments
- Cash remaining after investments
- Essential-expense total and ratio
- Discretionary-expense total and ratio
- Fixed-expense total and ratio
- Variable-expense total and ratio
- Family-support total and ratio
- Subscription monthly-equivalent total
- Savings rate
- Investment rate
- Budget utilization
- Category variance from previous month
- Rolling three-month average
- Daily spending average
- Spending velocity versus elapsed days in month
- Projected month-end spending
- Highest transactions
- Recurring-cost total
- Net-worth estimate
- Emergency-fund coverage in months
- Goal contribution requirement

### Recommended definitions

```text
netExpenses = expenses - refunds
cashSurplusBeforeInvestments = income - netExpenses
cashRemainingAfterInvestments = income - netExpenses - investments
savingsRate = max(cashSurplusBeforeInvestments, 0) / income
investmentRate = investments / income
budgetUtilization = netBudgetedExpenses / budgetAmount
emergencyFundMonths = liquidEmergencySavings / averageMonthlyEssentialExpenses
```

Document the exact business definition used for every metric. Handle zero income safely.

## 9.2 Anomaly detection

Implement deterministic anomaly detection before AI explanation:

- Compare transaction value against the user's historical values in the same category.
- Use a robust method such as median and median absolute deviation or IQR rather than relying only on mean and standard deviation.
- Require a minimum sample size.
- Do not label scheduled rent, salary, SIPs, or known subscriptions as anomalous merely because they are large.
- Return a reason code, evidence, and confidence level.

## 9.3 Cash-flow forecast

Forecast the end of the current month using:

- Cleared income and expenses
- Confirmed recurring items due before month-end
- Historical variable-spending pace
- Known subscriptions and bills

Return a range rather than false precision. Clearly mark forecast assumptions.

## 9.4 Financial health score

The score must be deterministic, explainable, and optional. Use a 0–100 score with configurable components such as:

- Savings behaviour: 25 points
- Budget adherence: 20 points
- Emergency-fund coverage: 20 points
- Essential-expense sustainability: 15 points
- High-cost debt or credit utilization: 10 points
- Subscription and recurring-cost control: 10 points

Do not punish missing data as though it were bad financial behaviour. Show “insufficient data” and normalize available components where appropriate.

---

## 10. AI Insight System

The AI is an explanation and recommendation layer over verified analytics. It is not the source of financial truth.

## 10.1 Data flow

```text
User requests insight
  -> authenticate user
  -> authorize period and data access
  -> load normalized user data
  -> deterministic analytics engine calculates metrics
  -> privacy filter removes unnecessary sensitive data
  -> build compact, structured insight payload
  -> call Google Gemini Interactions API on the server
  -> require structured JSON output
  -> validate output with Zod
  -> reject or safely retry invalid output
  -> save report with input hash and prompt version
  -> render recommendations with evidence
```

## 10.2 Privacy rules

- AI must be disabled by default until explicit consent.
- Send aggregated metrics wherever possible.
- Do not send email addresses, full names, account numbers, card numbers, uploaded files, authentication data, or unrelated notes.
- Replace account names with neutral labels when identity is unnecessary.
- Avoid sending raw transaction descriptions. Prefer normalized merchant/category labels and calculated aggregates.
- Treat transaction descriptions and imported text as untrusted data, not instructions.
- Configure the API request not to persist response state when supported and appropriate.
- Provide a settings page explaining what data is sent.
- Allow the user to delete stored insight reports.

## 10.3 Google Gemini implementation

- Use the official `@google/genai` SDK.
- Use the Gemini Interactions API with `store: false`.
- Read the model name from `GEMINI_MODEL`.
- Use a current cost-efficient model that supports structured outputs. Do not spread a hardcoded model name throughout the code.
- Use structured outputs with a strict JSON schema.
- Set conservative output limits.
- Add request timeouts, retry only transient failures, and use exponential backoff with jitter.
- Record provider-neutral token usage. Record cost only when reliable billing data is available; never invent a cost for free-tier requests.
- Rate-limit insight generation per user.
- Cache identical reports using `userId + period + analyticsVersion + inputHash + promptVersion + provider + model`.
- Never place the API key in `NEXT_PUBLIC_*` variables.

## 10.4 Structured insight schema

Create a Zod schema equivalent to:

```ts
{
  schemaVersion: string,
  period: {
    start: string,
    end: string
  },
  executiveSummary: string,
  biggestExpenses: Array<{
    categoryKey: string,
    categoryName: string,
    amount: number,
    percentageOfSpending: number,
    necessity: "essential" | "mostly_essential" | "discretionary" | "potentially_reducible" | "needs_context",
    explanation: string
  }>,
  overspendingAreas: Array<{
    categoryKey: string,
    reason: string,
    evidence: string,
    severity: "low" | "medium" | "high"
  }>,
  savingsOpportunities: Array<{
    rank: number,
    categoryKey: string | null,
    title: string,
    reason: string,
    action: string,
    estimatedMonthlySavingMin: number | null,
    estimatedMonthlySavingMax: number | null,
    difficulty: "easy" | "moderate" | "hard",
    impact: "low" | "medium" | "high"
  }>,
  protectedExpenses: Array<{
    categoryKey: string,
    reason: string
  }>,
  positiveHabits: string[],
  nextMonthTargets: Array<{
    title: string,
    target: string,
    reason: string
  }>,
  questionsForUser: string[],
  disclaimer: string
}
```

All monetary figures returned by the model must be checked against supplied analytics or treated as non-authoritative. Prefer sending allowed impact figures in the input and requiring the model to reference them rather than calculate new amounts.

## 10.5 System prompt requirements

Create a versioned prompt file. It must instruct the model to:

- Use only the supplied analytics.
- Never invent missing income, expenses, returns, interest rates, or personal facts.
- Never claim certainty about future returns.
- Never tell the user to buy or sell a specific security.
- Never provide tax, legal, or regulated investment advice.
- Clearly distinguish observation, estimate, and recommendation.
- Provide evidence keys for each finding.
- Prefer practical actions that preserve essential needs, family responsibilities, health, and required services.
- Avoid shaming language.
- Not treat money sent to family as automatically wasteful.
- Not recommend cancelling an essential subscription or service without context.
- Return only the requested structured format.

## 10.6 AI failure handling

When Gemini is unavailable, rate-limited, disabled, or returns invalid output:

- Continue showing deterministic analytics.
- Display a non-alarming message that AI commentary is temporarily unavailable.
- Never block transaction entry, reports, budgets, or other core features.
- Do not expose raw provider errors.

---

## 11. Savings Opportunity Logic

Before asking AI for wording, produce machine-calculated candidate opportunities such as:

1. A discretionary category increased materially versus its three-month baseline.
2. A budget is projected to exceed its limit.
3. Multiple overlapping AI/software subscriptions exist.
4. A subscription has no recent usage recorded.
5. Dining-out cost exceeds the user's own configured target.
6. Repeated bank charges or late fees appear.
7. A recurring bill increased from its previous amount.
8. An annual subscription may be cheaper only when the break-even calculation is verified.
9. A selected reduction in discretionary spending would accelerate a goal.
10. The emergency fund is below the user's target.

Each opportunity must include:

- Evidence
- Baseline
- Current amount
- Calculation method
- Potential monthly impact
- Confidence
- Trade-off or limitation

Do not use generic advice such as “spend less” without evidence.

---

## 12. CSV Import and Export

## 12.1 Import flow

Route: `/transactions/import`

1. Upload CSV with strict size and type limits.
2. Parse on the server or in a secure worker.
3. Show a preview.
4. Let the user map columns to date, description, amount, debit, credit, category, and account.
5. Select date and decimal formats.
6. Normalize rows.
7. Detect duplicates using a stable fingerprint.
8. Validate every row.
9. Show errors before commit.
10. Import valid rows in a database transaction or safe batches.
11. Display imported, skipped, duplicate, and failed counts.
12. Allow downloading an error CSV.

### Fingerprint suggestion

Hash a canonical combination of:

```text
userId + accountId + normalizedDate + normalizedAmount + normalizedDescription + transactionType
```

Do not rely on description alone.

## 12.2 Export

Support:

- Filtered transaction CSV
- Monthly report CSV
- Full user data JSON or ZIP export

Exports must only contain the authenticated user's data and should be generated through a protected server route.

---

## 13. Recurring Processing and Scheduled Jobs

Create protected cron route handlers:

- `/api/cron/recurring` — create due recurring occurrences
- `/api/cron/notifications` — generate upcoming-bill and threshold notifications
- `/api/cron/monthly-snapshots` — calculate completed-month snapshots
- `/api/cron/monthly-insights` — optional and only for users who explicitly enabled scheduled AI reports

Requirements:

- Require `CRON_SECRET` or platform-verified cron authentication.
- Use idempotency keys.
- Log only safe operational metadata.
- Process bounded batches.
- Continue after an individual user's failure.
- Never generate AI reports for users who disabled AI.

---

## 14. API and Server Action Design

Use server actions for tightly coupled form mutations where appropriate and route handlers for imports, exports, cron jobs, and public API-style operations.

Suggested endpoints:

```text
GET/POST       /api/accounts
GET/PATCH/DELETE /api/accounts/:id
GET/POST       /api/transactions
GET/PATCH/DELETE /api/transactions/:id
POST           /api/transactions/import/preview
POST           /api/transactions/import/commit
GET            /api/transactions/export
GET/POST       /api/budgets
GET/POST       /api/recurring
GET/POST       /api/subscriptions
GET/POST       /api/goals
GET/POST       /api/investments
GET            /api/analytics/summary
POST           /api/insights/generate
GET            /api/insights/:id
GET            /api/reports/:type
GET/PATCH      /api/settings
POST           /api/data-export
DELETE         /api/account
```

### Response rules

- Return consistent typed success and error envelopes.
- Use appropriate HTTP status codes.
- Do not reveal whether another user's resource exists; return a generic not-found response after ownership filtering.
- Include request IDs for support diagnostics.
- Never return Prisma errors or stack traces to clients.

---

## 15. Authentication and Authorization

1. Use a vetted Auth.js flow rather than custom password/session cryptography.
2. Prefer database-backed sessions for easy revocation.
3. Use secure, `HttpOnly`, `SameSite`, and production-only secure cookies.
4. Require verified email where appropriate.
5. Add optional MFA-ready architecture even if MFA UI is phase 2.
6. Protect every authenticated layout and server operation.
7. Build reusable authorization helpers such as:

```ts
requireUser();
requireOwnedAccount(userId, accountId);
requireOwnedTransaction(userId, transactionId);
requireOwnedCategoryOrSystemCategory(userId, categoryId);
```

8. Never accept `userId` from a client mutation body as the authoritative owner.
9. Add session listing and revocation if supported by the chosen Auth.js setup.
10. Rate-limit login, reset, import, and AI routes.

---

## 16. Security Requirements

Treat this as a sensitive financial-data application.

### Required controls

- TLS in production
- Secure headers and Content Security Policy
- Server-side authorization
- Zod validation at trust boundaries
- Parameterized ORM queries
- CSRF protection appropriate to the chosen action/route pattern
- XSS-safe rendering
- Rate limiting
- Brute-force protection
- Secret management through environment variables or platform secret store
- Dependency auditing
- Structured logging with redaction
- Error monitoring without sensitive payloads
- Database backups and restore documentation
- Data export and deletion
- Least-privilege database credentials
- Separate development, test, and production environments
- No production data in local development
- No secrets in Git history

### AI-specific controls

- Server-only API access
- Explicit consent
- Data minimization
- Prompt-injection resistance
- Strict structured output validation
- Output treated as untrusted content
- No tool allowing the model to mutate transactions or perform payments
- Cost and request limits
- User-visible disclaimer

### CSV-specific controls

- File-size limits
- MIME and content validation
- Formula-injection protection during export: prefix cells beginning with `=`, `+`, `-`, or `@` where needed
- Bounded row count
- Safe parser configuration
- No arbitrary file execution
- Temporary file cleanup

### Logging restrictions

Redact or omit:

- Passwords
- Session cookies
- Auth tokens
- Gemini API key
- Full transaction descriptions when unnecessary
- Full account/card identifiers
- Uploaded CSV contents
- Complete AI payloads containing financial data

Use OWASP ASVS as a security checklist and document which controls are addressed.

---

## 17. Performance and Reliability

- Use server-side pagination for transactions.
- Add the indexes listed in the database section.
- Avoid N+1 queries.
- Cache only safe, user-scoped derived data.
- Invalidate dashboard caches after relevant mutations.
- Use database transactions for multi-record financial changes.
- Use idempotency for imports, recurring generation, and insight generation.
- Add loading skeletons and streamed server rendering where useful.
- Set strict timeouts on external API calls.
- Use graceful degradation when Redis, Gemini, or monitoring is unavailable.
- Add health/readiness endpoints that do not reveal secrets.

---

## 18. UI and Visual Design

Create a polished, trustworthy financial dashboard—not a flashy gaming interface.

### Design direction

- Clean, modern, calm, and data-focused
- Excellent spacing and typographic hierarchy
- Responsive from 360px mobile width through large desktop screens
- Light and dark themes
- Accessible contrast
- Consistent semantic colors for positive, warning, critical, income, expense, investment, and transfer states
- Do not rely on color alone
- Helpful empty states and onboarding prompts
- Charts with legends, tooltips, labels, and table alternatives where practical
- Currency formatting through `Intl.NumberFormat`
- Date formatting based on user locale and timezone

### Charts

Use only charts that improve understanding:

- Line or area chart for monthly trend
- Bar chart for category comparison
- Donut chart only for a small number of top-level allocation groups
- Progress bars for budgets and goals
- Waterfall-style summary if implemented clearly

Avoid 3D charts and excessive animation. Respect reduced-motion preferences.

---

## 19. Accessibility

Meet WCAG 2.1 AA principles:

- Keyboard-accessible navigation and dialogs
- Visible focus states
- Correct labels and descriptions
- Semantic headings
- Screen-reader-friendly form errors
- Accessible tables
- Chart summaries
- Sufficient contrast
- Reduced-motion support
- No interaction dependent only on hover

Run automated accessibility checks in tests and manually verify core flows.

---

## 20. Suggested Project Structure

```text
finpilot-ai/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── budgets/
│   │   ├── recurring/
│   │   ├── subscriptions/
│   │   ├── investments/
│   │   ├── goals/
│   │   ├── insights/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── cron/
│   │   ├── imports/
│   │   ├── exports/
│   │   └── insights/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── charts/
│   ├── forms/
│   ├── finance/
│   └── layout/
├── modules/
│   ├── accounts/
│   ├── transactions/
│   ├── budgets/
│   ├── recurring/
│   ├── subscriptions/
│   ├── goals/
│   ├── investments/
│   ├── analytics/
│   ├── insights/
│   ├── imports/
│   ├── notifications/
│   └── audit/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── money/
│   ├── dates/
│   ├── validation/
│   ├── rate-limit/
│   ├── logging/
│   └── security/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── prompts/
│   └── monthly-insight.v3.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── scripts/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
└── package.json
```

Keep business logic out of page files and React components.

---

## 21. Environment Variables

Create `.env.example` with documented placeholders:

```bash
# App
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=replace_with_32_plus_random_bytes

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# Email/auth provider, depending on chosen Auth.js flow
EMAIL_SERVER=
EMAIL_FROM=

# AI / Google Gemini — server only
AI_PROVIDER=gemini
AI_MONTHLY_USER_REQUEST_LIMIT=20
AI_MAX_OUTPUT_TOKENS=1500
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=configured_model_here

# Monitoring
SENTRY_DSN=

# Data protection/application encryption when needed
APP_ENCRYPTION_KEY=
```

Validate environment variables at startup with Zod. Do not require optional production services in local development.

---

## 22. Docker and Local Development

Provide:

1. `docker-compose.yml` with PostgreSQL and optional local Redis profile.
2. A production-ready multi-stage `Dockerfile` for the Next.js app.
3. Named volumes for development data.
4. Health checks.
5. Commands for migration, seeding, tests, and reset.

Expected local workflow:

```bash
cp .env.example .env
# fill required secrets

docker compose up -d postgres
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Also support a fully containerized startup if practical.

---

## 23. Seed Data

Create realistic demo data for a test user, without real personal details:

- Salary: ₹80,000 monthly
- Rent: ₹18,000
- Groceries: ₹7,500
- Dining: ₹4,000
- Electricity: ₹2,200
- Internet/mobile: ₹1,500
- Transport: ₹5,000
- AI subscriptions: ₹3,000
- Family support: ₹10,000
- Mutual-fund SIP: ₹8,000
- Miscellaneous: ₹3,500

Include three to six months of data so trends and anomaly detection work. Add accounts, budgets, subscriptions, a mutual-fund holding, an emergency-fund goal, and recurring rules.

Never seed a real email password or API key.

---

## 24. Testing Requirements

## 24.1 Unit tests

Cover:

- Decimal money operations
- Income/expense/transfer/investment/refund counting
- Credit-card purchase and payment behaviour
- Budget utilization
- Savings and investment rates
- Emergency-fund months
- Goal contribution calculation
- Subscription monthly-equivalent calculation
- Month boundaries in different timezones
- Recurring schedule calculation
- Import fingerprint generation
- Duplicate detection
- Anomaly detection
- Health-score calculation
- AI payload privacy filtering
- Structured AI output validation

## 24.2 Integration tests

Cover:

- Authenticated CRUD
- Ownership filtering and horizontal-access prevention
- Database transaction rollback
- CSV preview and commit
- Recurring job idempotency
- Notification deduplication
- Monthly snapshot generation
- Insight caching and rate limiting
- Account deletion and data cleanup

Use a dedicated test database.

## 24.3 End-to-end tests

Playwright flows:

1. Sign up/login.
2. Complete onboarding.
3. Add salary.
4. Add rent and food expenses.
5. Add a transfer between own accounts and verify it is excluded from expenses.
6. Add a mutual-fund contribution and verify it is shown as investment, not consumption.
7. Create a category budget and see progress update.
8. Import a CSV and skip duplicates.
9. Generate an AI insight with the Gemini provider mocked.
10. Export transactions.
11. Change timezone/theme/settings.
12. Delete or archive a record and verify authorization.

## 24.4 Security tests

- Unauthenticated protected-route access
- Cross-user resource access
- Invalid IDs and malformed payloads
- Oversized CSV
- CSV formula injection
- Rate-limit behaviour
- Sensitive-log redaction
- Gemini API key absent from client bundle

## 24.5 Quality gates

Create scripts for:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

CI must fail on any quality-gate failure.

---

## 25. CI/CD

Create a GitHub Actions workflow that:

1. Installs dependencies with a frozen lockfile.
2. Runs formatting verification.
3. Runs linting.
4. Runs TypeScript checks.
5. Starts a PostgreSQL service.
6. Applies migrations.
7. Runs unit and integration tests.
8. Builds the application.
9. Runs Playwright on protected branches or pull requests when feasible.
10. Optionally runs dependency and secret scanning.

Do not print secrets in CI logs.

---

## 26. Deployment

Document deployment using:

- Vercel or a comparable Node.js host
- Managed PostgreSQL such as Neon, Supabase Postgres, Prisma Postgres, or another standard provider
- Redis-compatible production rate limiter
- Managed email provider for authentication emails
- Optional Sentry monitoring

Deployment checklist:

- Production secrets configured
- Migrations applied through a controlled release step
- Database backups enabled
- HTTPS enabled
- Secure cookies verified
- Cron secret configured
- Gemini quotas and per-user usage limits configured
- Error logging redaction verified
- Privacy and terms pages published
- Data-export and deletion flows tested
- Seed/demo credentials disabled in production

Do not run destructive development migrations against production.

---

## 27. AI Usage and Gemini Quota Controls

Implement safeguards so AI remains inexpensive:

1. Generate insights only on demand by default.
2. Cache reports until underlying financial data changes.
3. Send compact aggregated JSON rather than complete transaction history.
4. Use a cost-efficient structured-output-capable model configured through `GEMINI_MODEL`.
5. Set per-user monthly request limits.
6. Set maximum output tokens.
7. Prevent parallel duplicate requests.
8. Store provider-neutral token usage; store cost only when reliable billing data is available.
9. Add an admin-free operational command or report showing aggregate AI usage without exposing user financial data.
10. Keep all non-AI analytics available for free when API credits are exhausted.

---

## 28. Error Handling and Empty States

Provide polished handling for:

- No accounts
- No transactions
- No income
- No budget
- Missing previous-month history
- Missing investment valuation
- Zero-income rate calculations
- Failed CSV rows
- Gemini unavailable
- Database timeout
- Expired session
- Unauthorized access
- Recurring job failure

Messages should explain what the user can do next without exposing internals.

---

## 29. Observability

Add:

- Request ID propagation
- Structured server logs
- Safe audit events
- Error monitoring adapter
- Cron execution metrics
- Import metrics
- AI latency, error, token, and cache-hit metrics
- Database query performance visibility in production tooling

Do not use analytics or monitoring to collect transaction contents unless explicitly required and consented to.

---

## 30. README Requirements

The generated `README.md` must contain:

1. Product overview
2. Feature list
3. Screenshots section
4. Architecture diagram
5. Technology choices and rationale
6. Local prerequisites
7. Environment variables
8. Docker setup
9. Non-Docker setup
10. Database migration and seed commands
11. Test commands
12. AI privacy model
13. Security notes
14. Deployment instructions
15. Cron setup
16. Backup and restore notes
17. Troubleshooting
18. Known limitations
19. Future roadmap

---

## 31. Implementation Order

Build in this order and keep the application working after every stage:

### Stage 1 — Foundation

- Initialize Next.js TypeScript project
- Add styling and component system
- Configure linting, formatting, tests, environment validation, and Docker PostgreSQL
- Configure Prisma and Auth.js
- Create protected application shell

### Stage 2 — Financial data model

- Implement migrations
- Seed categories and demo data
- Build account and transaction services
- Implement all financial counting and balance rules with unit tests

### Stage 3 — Core UI

- Onboarding
- Accounts
- Transactions
- Dashboard
- Filters and pagination

### Stage 4 — Planning features

- Budgets
- Recurring rules
- Subscriptions
- Goals
- Investment contributions
- Notifications

### Stage 5 — Analytics and reports

- Deterministic metrics
- Forecasts
- Anomalies
- Monthly snapshots
- Reports and exports

### Stage 6 — AI

- Consent flow
- Privacy filter
- Gemini server provider
- Structured output
- Caching, rate limiting, error handling, and cost tracking
- Insights UI

### Stage 7 — Imports and hardening

- CSV import
- Audit logging
- Security headers
- Data export/delete
- Performance indexes
- Accessibility improvements

### Stage 8 — Verification and deployment

- Unit, integration, and end-to-end tests
- CI
- Production build
- Deployment documentation
- Final acceptance checklist

---

## 32. Acceptance Criteria

The project is complete only when all of the following are true:

- A new user can register, complete onboarding, and access only their own data.
- The user can create every required transaction type.
- Transfers are not counted as spending.
- Credit-card payments do not duplicate expenses.
- Investments are shown separately from consumption expenses.
- Refunds reduce the correct spending totals.
- Dashboard figures match database-backed deterministic calculations.
- Budgets update immediately after transaction changes.
- Recurring transactions are generated exactly once per occurrence.
- Subscription monthly-equivalent totals are correct.
- Goals and emergency-fund coverage are calculated correctly.
- CSV import previews, validates, detects duplicates, and reports errors.
- Reports can be filtered and exported.
- AI is opt-in, server-side, rate-limited, structured, privacy-filtered, and non-blocking.
- Every AI recommendation cites supplied evidence metrics.
- The app remains useful when Gemini is disabled or unavailable.
- Cross-user access tests pass.
- No API key or secret appears in the browser bundle or repository.
- Mobile and desktop layouts work.
- Accessibility checks pass for core routes.
- Lint, type check, tests, and production build pass.
- Docker setup and README instructions work from a clean clone.

---

## 33. Final Codex Deliverables

Codex must return a repository containing:

- Complete application source code
- Prisma schema and migrations
- Seed data
- Authentication
- Full CRUD and financial logic
- Analytics engine
- AI insight integration
- CSV import/export
- Scheduled jobs
- Responsive UI
- Unit, integration, security, and end-to-end tests
- Docker Compose and Dockerfile
- CI workflow
- `.env.example`
- Architecture and setup documentation
- No unresolved required-feature placeholders

At the end, Codex should provide:

1. A concise implementation summary.
2. The final folder structure.
3. Exact local startup commands.
4. Exact test commands.
5. Required environment variables.
6. Database migration status.
7. Any genuinely optional integrations not enabled by default.
8. Evidence that linting, type checking, tests, and build succeeded.

---

## 34. Recommended Official References

Codex should verify current APIs and installation instructions against official documentation before implementing:

- Gemini API documentation: `https://ai.google.dev/gemini-api/docs`
- Gemini Interactions API: `https://ai.google.dev/gemini-api/docs/interactions-overview`
- Gemini structured output: `https://ai.google.dev/gemini-api/docs/structured-output`
- Gemini models: `https://ai.google.dev/gemini-api/docs/models`
- Gemini rate limits: `https://ai.google.dev/gemini-api/docs/rate-limits`
- Next.js App Router documentation: `https://nextjs.org/docs/app`
- Prisma documentation: `https://www.prisma.io/docs`
- PostgreSQL documentation: `https://www.postgresql.org/docs/`
- Auth.js documentation: `https://authjs.dev/`
- OWASP ASVS: `https://owasp.org/www-project-application-security-verification-standard/`
- Playwright documentation: `https://playwright.dev/docs/intro`

Do not copy old blog-post implementations when current official documentation differs.

---

# Final Instruction to Codex

Build **FinPilot AI** as a secure, production-ready personal finance application. Start by creating a short internal implementation checklist, then implement the repository end to end. Make reasonable decisions without repeatedly asking for confirmation. Preserve the financial rules, privacy controls, deterministic calculations, AI boundaries, tests, and acceptance criteria in this specification.
