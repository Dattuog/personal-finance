import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <a
        href="#main-content"
        className="sr-only-focusable fixed top-4 left-4 z-50 rounded-lg bg-[var(--primary)] px-4 py-3 text-white"
      >
        Skip to content
      </a>
      <header className="border-b border-[var(--border)]/80 bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <nav
            aria-label="Public navigation"
            className="flex items-center gap-1 sm:gap-3"
          >
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost" })}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({ variant: "primary" })}
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 FinPilot AI. Your numbers remain yours.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--foreground)]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--foreground)]">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
