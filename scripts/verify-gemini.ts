import "dotenv/config";

import { calculateFinancialSummary } from "@/modules/analytics/calculate-summary";
import { safeAIProviderMessage } from "@/modules/insights/errors";
import { buildPrivacyFilteredInsightPayload } from "@/modules/insights/privacy";
import { createFinanceAIProvider } from "@/modules/insights/provider-factory";

async function verifyGemini() {
  const instant = new Date("2026-08-01T00:00:00.000Z");
  const summary = calculateFinancialSummary([
    {
      id: "synthetic-income",
      type: "INCOME",
      amount: "60000",
      date: instant,
    },
    {
      id: "synthetic-expense",
      type: "EXPENSE",
      amount: "25000",
      date: instant,
      necessity: "ESSENTIAL",
      costBehaviour: "FIXED",
    },
    {
      id: "synthetic-investment",
      type: "INVESTMENT",
      amount: "8000",
      date: instant,
    },
  ]);
  const payload = buildPrivacyFilteredInsightPayload({
    period: {
      start: instant,
      end: new Date("2026-08-31T23:59:59.999Z"),
      month: "August",
      year: 2026,
    },
    currencyCode: "INR",
    summary,
    previousSummary: calculateFinancialSummary([]),
    hasPreviousMonthData: false,
    currentTransactions: [
      {
        type: "INCOME",
        amount: "60000",
        categoryKey: "salary",
        categoryName: "Salary",
      },
      {
        type: "EXPENSE",
        amount: "25000",
        categoryKey: "rent",
        categoryName: "Rent",
        essentiality: "essential",
      },
      {
        type: "INVESTMENT",
        amount: "8000",
        categoryKey: "mutual-funds",
        categoryName: "Mutual Fund SIP",
      },
    ],
    previousTransactions: [],
    subscriptions: [],
    budgets: [],
    opportunities: [],
  });

  console.warn(
    "Privacy reminder: use only synthetic or anonymised finance data when testing a hosted AI tier.",
  );

  const provider = createFinanceAIProvider();
  const result = await provider.generateFinancialInsight(payload);

  console.log(
    `Gemini verification succeeded with ${result.usage.model}; total tokens: ${result.usage.totalTokens ?? "not reported"}.`,
  );
}

try {
  await verifyGemini();
} catch (error) {
  console.error(`Gemini verification failed: ${safeAIProviderMessage(error)}`);
  process.exitCode = 1;
}
