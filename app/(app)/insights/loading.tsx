import { Card } from "@/components/ui/card";

export default function InsightsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading AI insights">
      <div className="h-64 animate-pulse rounded-3xl bg-[var(--primary-soft)]" />
      <span className="sr-only">Loading AI insights…</span>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="h-40 animate-pulse bg-[var(--muted)]" />
        ))}
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.5fr_.75fr]">
        <Card className="h-96 animate-pulse bg-[var(--muted)]" />
        <Card className="h-96 animate-pulse bg-[var(--muted)]" />
      </div>
    </div>
  );
}
