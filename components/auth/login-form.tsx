"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { login } from "@/actions/profile";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login({ email, password });
      posthog.identify(email, { email });
      posthog.capture("user_logged_in", { email });
      router.push("/my-activities");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      posthog.capture("user_login_failed", { email, error: message });
      setError(message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-text-faint"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
        />
      </div>

      {error && <p className="text-sm text-danger-cta">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-sm bg-accent px-4 py-2 text-sm font-med text-white transition-colors duration-(--duration-base) hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
