import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="FinPilot AI home"
      className="inline-flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--primary)] text-white shadow-sm">
        <svg viewBox="0 0 28 28" className="size-5" aria-hidden="true">
          <path
            d="M5 20.5 12 6l3.1 7L23 9.5 17.4 22H9.2Z"
            fill="currentColor"
          />
          <path
            d="M11.4 17.3h7.2"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
          />
        </svg>
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-[-0.025em] text-[var(--foreground)]">
          FinPilot <span className="text-[var(--primary)]">AI</span>
        </span>
      )}
    </Link>
  );
}
