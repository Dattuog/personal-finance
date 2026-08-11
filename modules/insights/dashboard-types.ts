export interface MonthlyTrendPoint {
  label: string;
  periodLabel: string;
  income: number;
  expenses: number;
  investments: number;
  cashRemaining: number;
}

export interface CategorySpendingPoint {
  key: string;
  name: string;
  value: number;
  share: number;
}

export interface SpendingSplitPoint {
  name: string;
  value: number;
  share: number;
  tone: "essential" | "discretionary" | "unclassified";
}

export interface BudgetProgressItem {
  id: string;
  name: string;
  spent: number;
  amount: number;
  utilization: number;
  status: "on_track" | "watch" | "over";
}

export interface SavingsOpportunity {
  key: string;
  categoryKey: string | null;
  title: string;
  explanation: string;
  action: string;
  evidence: string;
  evidenceMetricKeys: readonly string[];
  potentialMonthlyImpact: number | null;
  confidence: "low" | "medium" | "high";
  tone: "positive" | "attention" | "neutral";
}

export interface SpendingForecast {
  projectedExpensesLow: number;
  projectedExpensesHigh: number;
  elapsedPercent: number;
  confidence: "low" | "medium";
}
