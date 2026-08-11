"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailSignInForm({
  callbackUrl = "/dashboard",
}: {
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });
      if (result?.error)
        setError(
          "We could not send the secure link. Check the address and try again.",
        );
      else router.replace("/login?sent=1");
    } catch {
      setError(
        "The sign-in service is temporarily unavailable. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={error ? "email-error" : "email-help"}
          className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 transition outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/25"
          placeholder="you@example.com"
        />
        <p
          id="email-help"
          className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]"
        >
          We’ll email you a one-time link that expires in 15 minutes.
        </p>
      </div>
      {error && (
        <p
          id="email-error"
          role="alert"
          className="rounded-xl bg-[var(--destructive-soft)] p-3 text-sm text-[var(--destructive)]"
        >
          {error}
        </p>
      )}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight className="size-4" aria-hidden="true" />
        )}
        {isLoading ? "Sending secure link…" : "Continue securely"}
      </Button>
    </form>
  );
}
