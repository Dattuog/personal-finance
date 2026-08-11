import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <Policy
      title="Privacy notice"
      intro="FinPilot is designed to minimize the financial and identity data it processes."
      sections={[
        [
          "What we store",
          "Account labels, transactions you enter, planning data, authentication records, and your privacy settings. We never ask for online banking passwords or full card numbers.",
        ],
        [
          "AI is optional",
          "AI features are disabled by default. If enabled, the server sends compact calculated metrics—not your email, full name, account identifiers, authentication data, raw notes, merchants, or transaction descriptions. User-defined analytics labels are length-limited and screened for identifiers before sending.",
        ],
        [
          "Your controls",
          "You can disable future AI processing in Settings at any time. Contact the operator of your deployment to request account-data access or deletion until self-service export and deletion controls are available.",
        ],
      ]}
    />
  );
}

function Policy({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: readonly (readonly [string, string])[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="text-sm font-bold tracking-[0.16em] text-[var(--primary)] uppercase">
        Last updated 11 August 2026
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-[var(--muted-foreground)]">
        {intro}
      </p>
      <div className="mt-10 space-y-9">
        {sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="text-xl font-bold">{heading}</h2>
            <p className="mt-2 leading-7 text-[var(--muted-foreground)]">
              {body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
