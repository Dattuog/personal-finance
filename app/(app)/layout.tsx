import { Logo } from "@/components/ui/logo";
import {
  DesktopNavigation,
  MobileNavigation,
} from "@/components/layout/app-navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { requireUser } from "@/lib/auth/require-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="min-h-screen">
      <a
        href="#app-content"
        className="sr-only-focusable fixed top-4 left-4 z-50 rounded-lg bg-[var(--primary)] px-4 py-3 text-white"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] border-r border-[var(--border)] bg-[var(--surface)] lg:block">
        <div className="flex h-18 items-center border-b border-[var(--border)] px-5">
          <Logo />
        </div>
        <DesktopNavigation />
        <div className="absolute inset-x-4 bottom-5 rounded-xl bg-[var(--primary-soft)] p-4">
          <p className="text-sm font-bold text-[var(--primary)]">
            Financial truth first
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
            Transfers and investments stay separate from everyday spending.
          </p>
        </div>
      </aside>
      <div className="lg:pl-[var(--sidebar-width)]">
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/92 px-5 backdrop-blur sm:px-8">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <p className="hidden text-sm font-medium text-[var(--muted-foreground)] lg:block">
            Private financial workspace
          </p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu name={user.name ?? null} email={user.email ?? null} />
          </div>
        </header>
        <main
          id="app-content"
          className="mx-auto max-w-[1500px] px-4 pt-6 pb-24 sm:px-8 sm:pt-8 lg:pb-10"
        >
          {children}
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
