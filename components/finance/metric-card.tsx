import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  definition,
  icon: Icon,
  tone = "default",
  detail,
}: {
  label: string;
  value: string;
  definition: string;
  icon: LucideIcon;
  tone?: "default" | "income" | "expense" | "investment";
  detail?: string;
}) {
  const colors = {
    default: "text-[var(--foreground)]",
    income: "text-[var(--income)]",
    expense: "text-[var(--expense)]",
    investment: "text-[var(--investment)]",
  };
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span
          title={definition}
          aria-label={`Definition: ${definition}`}
          className="cursor-help text-[var(--muted-foreground)]"
        >
          <Info className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm font-medium text-[var(--muted-foreground)]">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold tracking-[-0.025em] tabular-nums ${colors[tone]}`}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">{detail}</p>
      )}
    </Card>
  );
}
