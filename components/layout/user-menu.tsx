"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function UserMenu({
  name,
  email,
}: {
  name: string | null;
  email: string | null;
}) {
  const displayName = name?.trim() || email?.split("@")[0] || "Account";
  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <p className="max-w-40 truncate text-sm font-semibold">{displayName}</p>
        <p className="max-w-40 truncate text-xs text-[var(--muted-foreground)]">
          {email}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Log out"
        onClick={() => void signOut({ callbackUrl: "/" })}
      >
        <LogOut className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
