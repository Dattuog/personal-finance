"use client";

import { useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CategorySpendingPoint,
  MonthlyTrendPoint,
} from "@/modules/insights/dashboard-types";

const categoryColors = [
  "var(--primary)",
  "var(--accent)",
  "var(--investment)",
  "var(--transfer)",
  "var(--success)",
  "var(--muted-foreground)",
];
const subscribeToHydration = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

function useMoneyFormat(currencyCode: string, locale: string) {
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  });
  const compactMoney = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return {
    money: (value: number) => money.format(value),
    compactMoney: (value: number) => compactMoney.format(value),
  };
}

function ChartLoadingState({ label }: { label: string }) {
  return (
    <div
      className="grid h-full place-items-center rounded-xl bg-[var(--background)] text-sm text-[var(--muted-foreground)]"
      aria-label={`${label} is loading`}
    >
      Preparing chart…
    </div>
  );
}

export function CashFlowTrendChart({
  data,
  currencyCode,
  locale,
}: {
  data: readonly MonthlyTrendPoint[];
  currencyCode: string;
  locale: string;
}) {
  const hydrated = useHydrated();
  const { money, compactMoney } = useMoneyFormat(currencyCode, locale);

  return (
    <div
      className="h-80 w-full"
      role="img"
      aria-label="Six-month line chart comparing income, net expenses, and investments"
    >
      {hydrated ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={[...data]}
            margin={{ top: 12, right: 8, left: -12, bottom: 4 }}
            accessibilityLayer
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => compactMoney(Number(value))}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip
              formatter={(value, name) => [money(Number(value)), name]}
              labelFormatter={(_, payload) =>
                payload[0]?.payload.periodLabel ?? "Financial month"
              }
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--foreground)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="var(--income)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Net expenses"
              stroke="var(--expense)"
              strokeWidth={2.5}
              strokeDasharray="7 4"
              dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="investments"
              name="Invested"
              stroke="var(--investment)"
              strokeWidth={2.5}
              strokeDasharray="2 4"
              dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ChartLoadingState label="Cash-flow trend" />
      )}
      <table className="sr-only">
        <caption>Six-month cash-flow trend data</caption>
        <thead>
          <tr>
            <th scope="col">Financial month</th>
            <th scope="col">Income</th>
            <th scope="col">Net expenses</th>
            <th scope="col">Invested</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.periodLabel}>
              <th scope="row">{point.periodLabel}</th>
              <td>{money(point.income)}</td>
              <td>{money(point.expenses)}</td>
              <td>{money(point.investments)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CategorySpendingChart({
  data,
  currencyCode,
  locale,
}: {
  data: readonly CategorySpendingPoint[];
  currencyCode: string;
  locale: string;
}) {
  const hydrated = useHydrated();
  const { money } = useMoneyFormat(currencyCode, locale);

  return (
    <div>
      <div
        className="h-64 w-full"
        role="img"
        aria-label="Donut chart showing this month’s net spending by category"
      >
        {hydrated ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer>
              <Pie
                data={[...data]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
                stroke="var(--surface)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {data.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={
                      categoryColors[index % categoryColors.length] ??
                      "var(--primary)"
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [money(Number(value)), name]}
                contentStyle={{
                  background: "var(--surface-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ChartLoadingState label="Category spending" />
        )}
      </div>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2" aria-label="Chart legend">
        {data.map((item, index) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="flex min-w-0 items-center gap-2 text-[var(--muted-foreground)]">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    categoryColors[index % categoryColors.length] ??
                    "var(--primary)",
                }}
                aria-hidden="true"
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-semibold tabular-nums">
              {money(item.value)} · {item.share}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
