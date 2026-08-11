"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InsightsError({ reset }: { reset: () => void }) {
  return (
    <Card className="mx-auto max-w-2xl border-[var(--destructive)]/30 p-7 text-center sm:p-10">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[var(--destructive-soft)] text-[var(--destructive)]">
        <CircleAlert className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold">Insights could not be loaded</h1>
      <p className="mt-2 leading-7 text-[var(--muted-foreground)]">
        Your financial records are unchanged. Try loading the calculated
        dashboard again.
      </p>
      <Button className="mt-5" onClick={reset}>
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </Button>
    </Card>
  );
}
