import { db } from "@/lib/db/client";

const systemCategories = [
  ["Salary", "salary", "INCOME", "NEUTRAL", "FIXED", "briefcase-business"],
  [
    "Freelance Income",
    "freelance-income",
    "INCOME",
    "NEUTRAL",
    "VARIABLE",
    "laptop",
  ],
  ["Bonus", "bonus", "INCOME", "NEUTRAL", "VARIABLE", "sparkles"],
  ["Rent", "rent", "EXPENSE", "ESSENTIAL", "FIXED", "house"],
  [
    "Groceries",
    "groceries",
    "EXPENSE",
    "ESSENTIAL",
    "VARIABLE",
    "shopping-basket",
  ],
  [
    "Dining Out",
    "dining-out",
    "EXPENSE",
    "DISCRETIONARY",
    "VARIABLE",
    "utensils",
  ],
  ["Electricity", "electricity", "EXPENSE", "ESSENTIAL", "VARIABLE", "zap"],
  ["Water", "water", "EXPENSE", "ESSENTIAL", "VARIABLE", "droplets"],
  ["Gas", "gas", "EXPENSE", "ESSENTIAL", "VARIABLE", "flame"],
  ["Internet", "internet", "EXPENSE", "ESSENTIAL", "FIXED", "wifi"],
  ["Mobile", "mobile", "EXPENSE", "ESSENTIAL", "FIXED", "smartphone"],
  ["Transport", "transport", "EXPENSE", "ESSENTIAL", "VARIABLE", "bus"],
  ["Fuel", "fuel", "EXPENSE", "ESSENTIAL", "VARIABLE", "fuel"],
  [
    "Healthcare",
    "healthcare",
    "EXPENSE",
    "ESSENTIAL",
    "VARIABLE",
    "heart-pulse",
  ],
  ["Insurance", "insurance", "EXPENSE", "ESSENTIAL", "FIXED", "shield-check"],
  [
    "Education",
    "education",
    "EXPENSE",
    "ESSENTIAL",
    "VARIABLE",
    "graduation-cap",
  ],
  [
    "Shopping",
    "shopping",
    "EXPENSE",
    "DISCRETIONARY",
    "VARIABLE",
    "shopping-bag",
  ],
  [
    "Entertainment",
    "entertainment",
    "EXPENSE",
    "DISCRETIONARY",
    "VARIABLE",
    "clapperboard",
  ],
  ["Travel", "travel", "EXPENSE", "DISCRETIONARY", "VARIABLE", "plane"],
  [
    "AI Subscriptions",
    "ai-subscriptions",
    "EXPENSE",
    "DISCRETIONARY",
    "FIXED",
    "bot",
  ],
  [
    "Software Subscriptions",
    "software-subscriptions",
    "EXPENSE",
    "DISCRETIONARY",
    "FIXED",
    "app-window",
  ],
  [
    "Family Support",
    "family-support",
    "EXPENSE",
    "ESSENTIAL",
    "FIXED",
    "heart-handshake",
  ],
  [
    "Loan Interest",
    "loan-interest",
    "EXPENSE",
    "ESSENTIAL",
    "FIXED",
    "landmark",
  ],
  [
    "Bank Charges",
    "bank-charges",
    "EXPENSE",
    "DISCRETIONARY",
    "VARIABLE",
    "receipt",
  ],
  ["Charity", "charity", "EXPENSE", "DISCRETIONARY", "VARIABLE", "hand-heart"],
  [
    "Emergency Savings",
    "emergency-savings",
    "INVESTMENT",
    "NEUTRAL",
    "FIXED",
    "shield",
  ],
  [
    "Mutual Funds",
    "mutual-funds",
    "INVESTMENT",
    "NEUTRAL",
    "FIXED",
    "chart-no-axes-combined",
  ],
  [
    "Stocks",
    "stocks",
    "INVESTMENT",
    "NEUTRAL",
    "VARIABLE",
    "chart-candlestick",
  ],
  [
    "Fixed Deposits",
    "fixed-deposits",
    "INVESTMENT",
    "NEUTRAL",
    "FIXED",
    "vault",
  ],
  ["Other", "other", "EXPENSE", "NEUTRAL", "VARIABLE", "ellipsis"],
] as const;

async function main() {
  const categoryBySlug = new Map<string, string>();
  for (const [
    name,
    slug,
    kind,
    necessity,
    costBehaviour,
    icon,
  ] of systemCategories) {
    const existing = await db.category.findFirst({
      where: { userId: null, slug },
    });
    const category = existing
      ? await db.category.update({
          where: { id: existing.id },
          data: {
            name,
            kind,
            necessity,
            costBehaviour,
            icon,
            isSystem: true,
            isArchived: false,
          },
        })
      : await db.category.create({
          data: {
            name,
            slug,
            kind,
            necessity,
            costBehaviour,
            icon,
            isSystem: true,
            displayOrder: categoryBySlug.size,
          },
        });
    categoryBySlug.set(slug, category.id);
  }

  const getCategory = (slug: string): string => {
    const categoryId = categoryBySlug.get(slug);
    if (!categoryId) throw new Error(`Missing seeded category: ${slug}`);
    return categoryId;
  };

  const existingDemo = await db.user.findUnique({
    where: { email: "demo@finpilot.local" },
  });
  if (existingDemo) await db.user.delete({ where: { id: existingDemo.id } });

  const demo = await db.user.create({
    data: {
      name: "Aarav Demo",
      email: "demo@finpilot.local",
      emailVerified: new Date(),
      profile: {
        create: {
          currencyCode: "INR",
          timezone: "Asia/Kolkata",
          locale: "en-IN",
          monthlyIncomeTarget: "80000",
          onboardingCompletedAt: new Date(),
          aiEnabled: false,
        },
      },
    },
  });
  const bank = await db.financialAccount.create({
    data: {
      userId: demo.id,
      name: "Primary bank",
      type: "BANK",
      currencyCode: "INR",
      openingBalance: "145000",
      openingBalanceDate: new Date("2026-04-01"),
      institutionName: "Demo Bank",
      lastFourDigits: "1842",
      isIncludedInNetWorth: true,
    },
  });
  const cash = await db.financialAccount.create({
    data: {
      userId: demo.id,
      name: "Cash",
      type: "CASH",
      currencyCode: "INR",
      openingBalance: "3000",
      openingBalanceDate: new Date("2026-04-01"),
      isIncludedInNetWorth: true,
    },
  });
  const investment = await db.financialAccount.create({
    data: {
      userId: demo.id,
      name: "Mutual funds",
      type: "INVESTMENT",
      currencyCode: "INR",
      openingBalance: "120000",
      openingBalanceDate: new Date("2026-04-01"),
      institutionName: "Demo AMC",
      isIncludedInNetWorth: true,
    },
  });

  const txData = [];
  for (let month = 4; month <= 7; month += 1) {
    const date = (day: number) => new Date(Date.UTC(2026, month, day));
    txData.push(
      {
        userId: demo.id,
        type: "INCOME" as const,
        amount: "80000",
        transactionDate: date(1),
        destinationAccountId: bank.id,
        categoryId: getCategory("salary"),
        merchant: "Employer",
        description: "Monthly salary",
      },
      {
        userId: demo.id,
        type: "EXPENSE" as const,
        amount: "18000",
        transactionDate: date(2),
        sourceAccountId: bank.id,
        categoryId: getCategory("rent"),
        merchant: "Landlord",
        description: "House rent",
      },
      {
        userId: demo.id,
        type: "EXPENSE" as const,
        amount: month === 7 ? "8100" : "7500",
        transactionDate: date(8),
        sourceAccountId: bank.id,
        categoryId: getCategory("groceries"),
        merchant: "Neighbourhood market",
      },
      {
        userId: demo.id,
        type: "EXPENSE" as const,
        amount: month === 7 ? "5200" : "4000",
        transactionDate: date(12),
        sourceAccountId: bank.id,
        categoryId: getCategory("dining-out"),
        merchant: "Local dining",
      },
      {
        userId: demo.id,
        type: "EXPENSE" as const,
        amount: "2200",
        transactionDate: date(14),
        sourceAccountId: bank.id,
        categoryId: getCategory("electricity"),
        merchant: "Electric utility",
      },
      {
        userId: demo.id,
        type: "EXPENSE" as const,
        amount: "1500",
        transactionDate: date(15),
        sourceAccountId: bank.id,
        categoryId: getCategory("internet"),
        merchant: "Connectivity bundle",
      },
      {
        userId: demo.id,
        type: "EXPENSE" as const,
        amount: "5000",
        transactionDate: date(18),
        sourceAccountId: bank.id,
        categoryId: getCategory("transport"),
        merchant: "Transit and cabs",
      },
      {
        userId: demo.id,
        type: "EXPENSE" as const,
        amount: "3000",
        transactionDate: date(20),
        sourceAccountId: bank.id,
        categoryId: getCategory("ai-subscriptions"),
        merchant: "AI tools",
      },
      {
        userId: demo.id,
        type: "EXPENSE" as const,
        amount: "10000",
        transactionDate: date(22),
        sourceAccountId: bank.id,
        categoryId: getCategory("family-support"),
        merchant: "Family support",
      },
      {
        userId: demo.id,
        type: "INVESTMENT" as const,
        amount: "8000",
        transactionDate: date(25),
        sourceAccountId: bank.id,
        destinationAccountId: investment.id,
        categoryId: getCategory("mutual-funds"),
        merchant: "Index fund SIP",
      },
      {
        userId: demo.id,
        type: "EXPENSE" as const,
        amount: "3500",
        transactionDate: date(27),
        sourceAccountId: month % 2 === 0 ? cash.id : bank.id,
        categoryId: getCategory("other"),
        merchant: "Miscellaneous",
      },
    );
  }
  await db.transaction.createMany({ data: txData });

  const august = new Date("2026-08-01");
  await db.budget.createMany({
    data: [
      {
        userId: demo.id,
        name: "Monthly spending",
        period: "MONTHLY",
        startDate: august,
        amount: "56000",
        currencyCode: "INR",
        alertThresholdPercent: "80",
      },
      {
        userId: demo.id,
        name: "Dining limit",
        period: "MONTHLY",
        startDate: august,
        amount: "4500",
        currencyCode: "INR",
        categoryId: getCategory("dining-out"),
        alertThresholdPercent: "80",
      },
    ],
  });
  await db.subscription.create({
    data: {
      userId: demo.id,
      name: "AI toolkit",
      vendor: "AI tools",
      categoryId: getCategory("ai-subscriptions"),
      sourceAccountId: bank.id,
      amount: "3000",
      currencyCode: "INR",
      billingFrequency: "MONTHLY",
      nextRenewalDate: new Date("2026-08-20"),
      isEssential: false,
    },
  });
  await db.goal.create({
    data: {
      userId: demo.id,
      name: "Six-month emergency fund",
      type: "EMERGENCY_FUND",
      targetAmount: "300000",
      currentAmount: "135000",
      targetDate: new Date("2027-08-01"),
      priority: "HIGH",
      linkedAccountId: bank.id,
    },
  });
  const holding = await db.investmentHolding.create({
    data: {
      userId: demo.id,
      accountId: investment.id,
      name: "Broad market index fund",
      assetType: "MUTUAL_FUND",
      units: "487.221",
      averageCost: "311.96",
      currentPrice: "328.40",
      investedAmount: "152000",
      currentValue: "160000",
      valuationAsOf: new Date("2026-08-01"),
    },
  });
  const latestInvestment = await db.transaction.findFirstOrThrow({
    where: { userId: demo.id, type: "INVESTMENT" },
    orderBy: { transactionDate: "desc" },
  });
  await db.investmentContribution.create({
    data: {
      userId: demo.id,
      holdingId: holding.id,
      transactionId: latestInvestment.id,
      amount: latestInvestment.amount,
      contributionDate: latestInvestment.transactionDate,
    },
  });
  await db.recurringRule.createMany({
    data: [
      {
        userId: demo.id,
        name: "Salary",
        transactionType: "INCOME",
        amount: "80000",
        destinationAccountId: bank.id,
        categoryId: getCategory("salary"),
        frequency: "MONTHLY",
        dayOfMonth: 1,
        startDate: new Date("2026-05-01"),
        nextRunAt: new Date("2026-09-01"),
        autoCreate: true,
        requiresConfirmation: false,
      },
      {
        userId: demo.id,
        name: "House rent",
        transactionType: "EXPENSE",
        amount: "18000",
        sourceAccountId: bank.id,
        categoryId: getCategory("rent"),
        frequency: "MONTHLY",
        dayOfMonth: 2,
        startDate: new Date("2026-05-02"),
        nextRunAt: new Date("2026-09-02"),
        autoCreate: false,
        requiresConfirmation: true,
      },
    ],
  });
}

main()
  .then(() => db.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
