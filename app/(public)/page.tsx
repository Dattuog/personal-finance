import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  ChartNoAxesCombined,
  CircleCheck,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const principles = [
  {
    icon: ChartNoAxesCombined,
    title: "One honest picture",
    body: "Income, spending, investments, transfers, and refunds stay separate—so your surplus is never overstated.",
  },
  {
    icon: Sparkles,
    title: "Evidence before AI",
    body: "FinPilot calculates every metric first. AI can explain the result only after you opt in.",
  },
  {
    icon: LockKeyhole,
    title: "Private by design",
    body: "No bank passwords, no automated transfers, and server-side authorization on every protected operation.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_65%_0%,var(--primary-soft),transparent_68%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm font-semibold text-[var(--primary)]">
              <BadgeIndianRupee className="size-4" aria-hidden="true" />
              Built around the way money moves in India
            </div>
            <h1 className="max-w-3xl text-4xl leading-[1.08] font-bold tracking-[-0.045em] text-balance sm:text-6xl">
              Know where your money went. Decide where it goes next.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted-foreground)]">
              A calm financial command centre that turns transactions into a
              verified monthly picture—and practical next steps without shame or
              guesswork.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={buttonVariants({ variant: "primary" })}
              >
                Build my plan{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="#how-it-works"
                className={buttonVariants({ variant: "secondary" })}
              >
                See how it works
              </Link>
            </div>
            <ul className="mt-8 grid gap-3 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
              {[
                "Manual entry with verified totals",
                "AI disabled until you opt in",
                "INR and India timezone defaults",
                "Useful even without an AI key",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CircleCheck
                    className="size-4 text-[var(--success)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Card
            className="relative overflow-hidden p-4 shadow-[0_24px_70px_rgba(29,78,216,0.12)] sm:p-6"
            aria-label="Illustrative FinPilot dashboard preview"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.15em] text-[var(--muted-foreground)] uppercase">
                  Illustrative preview
                </p>
                <p className="mt-1 font-semibold">Your August position</p>
              </div>
              <span className="rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
                On track
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PreviewMetric
                label="Income"
                value="₹80,000"
                tone="text-[var(--income)]"
              />
              <PreviewMetric
                label="Net expenses"
                value="₹51,700"
                tone="text-[var(--expense)]"
              />
              <PreviewMetric
                label="Invested"
                value="₹8,000"
                tone="text-[var(--investment)]"
              />
              <PreviewMetric
                label="Cash remaining"
                value="₹20,300"
                tone="text-[var(--foreground)]"
              />
            </div>
            <div className="mt-4 rounded-xl bg-[var(--background)] p-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Monthly budget</span>
                <span className="text-[var(--muted-foreground)] tabular-nums">
                  74% used
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                <div className="h-full w-[74%] rounded-full bg-[var(--primary)]" />
              </div>
              <p className="mt-4 border-t border-[var(--border)] pt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                Dining is ₹1,240 above your three-month pace. Reducing one
                outing this month keeps your emergency goal on schedule.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-[0.16em] text-[var(--primary)] uppercase">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-balance sm:text-4xl">
            Financial clarity should be explainable.
          </h2>
          <p className="mt-4 text-lg text-[var(--muted-foreground)]">
            Every insight is grounded in a calculation you can inspect.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 leading-7 text-[var(--muted-foreground)]">
                {body}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

function PreviewMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <p className="text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
