"use client";

import Link from "next/link";
import { BrainCircuit, LoaderCircle, Settings } from "lucide-react";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { generateInsightAction } from "@/modules/insights/actions";
import { initialGenerateInsightActionState } from "@/modules/insights/action-state";

export function GenerateInsightButton({
  aiEnabled,
  hasReport,
}: {
  aiEnabled: boolean;
  hasReport: boolean;
}) {
  const [state, action, pending] = useActionState(
    generateInsightAction,
    initialGenerateInsightActionState,
  );

  if (!aiEnabled) {
    return (
      <Link
        href="/settings"
        className={buttonVariants({ variant: "secondary" })}
      >
        <Settings className="size-4" aria-hidden="true" />
        Enable AI in Settings
      </Link>
    );
  }

  return (
    <div>
      <form action={action}>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <BrainCircuit className="size-4" aria-hidden="true" />
          )}
          {pending
            ? "Analysing verified metrics…"
            : hasReport
              ? "Refresh AI review"
              : "Generate AI review"}
        </Button>
      </form>
      <div className="mt-2 max-w-md text-xs" aria-live="polite">
        {state.error && (
          <p className="text-[var(--destructive)]">{state.error}</p>
        )}
        {state.message && (
          <p className="text-[var(--success)]">{state.message}</p>
        )}
      </div>
    </div>
  );
}
