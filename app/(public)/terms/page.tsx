import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="text-sm font-bold tracking-[0.16em] text-[var(--primary)] uppercase">
        Last updated 11 August 2026
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Terms of use</h1>
      <p className="mt-5 text-lg leading-8 text-[var(--muted-foreground)]">
        FinPilot provides organizational tools and educational explanations. It
        does not provide regulated investment, tax, or legal advice.
      </p>
      <div className="mt-10 space-y-9 text-[var(--muted-foreground)]">
        <section>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Your responsibility
          </h2>
          <p className="mt-2 leading-7">
            Review imported data and calculations before relying on them. Do not
            use FinPilot to initiate transfers, payments, or investment trades.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Acceptable use
          </h2>
          <p className="mt-2 leading-7">
            Keep your sign-in links private and do not attempt to access another
            user’s data, disrupt the service, or upload malicious content.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Availability
          </h2>
          <p className="mt-2 leading-7">
            Core deterministic features remain independent from optional AI
            availability. External email, database, and hosting providers may
            affect service uptime.
          </p>
        </section>
      </div>
    </article>
  );
}
