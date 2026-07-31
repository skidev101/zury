"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(2, "Enter your name."),
});

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [isPending, setIsPending] = useState(false);
  const [providerPending, setProviderPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueWithGoogle() {
    setError(null);
    setProviderPending(true);

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/dashboard`,
      errorCallbackURL: `${window.location.origin}/sign-in?error=google`,
    });

    if (result.error) {
      setError(toFriendlyError(result.error.message));
      setProviderPending(false);
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const values = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
    const result = mode === "sign-up"
      ? signUpSchema.safeParse(values)
      : signInSchema.safeParse(values);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    setIsPending(true);

    const authResult = mode === "sign-up"
      ? await authClient.signUp.email({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          callbackURL: "/dashboard",
        })
      : await authClient.signIn.email({
          email: values.email.trim(),
          password: values.password,
          callbackURL: "/dashboard",
        });

    if (authResult.error) {
      setError(toFriendlyError(authResult.error.message));
      setIsPending(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
  }

  const disabled = isPending || providerPending;

  return (
    <div className="w-full max-w-[410px]">
      <div className="mb-8">
        <div className="mb-8 flex items-center gap-2.5 text-lg font-semibold lg:hidden">
          <span className="grid size-8 place-items-center rounded-[10px] border border-border-strong bg-gradient-to-br from-surface-hover to-surface text-sm text-accent" aria-hidden="true">Z</span>
          <span>Zury</span>
        </div>
        <h2 className="font-serif text-[clamp(2rem,7vw,2.75rem)] font-medium leading-tight tracking-[-0.045em]">{mode === "sign-in" ? "Welcome back" : "Create your space"}</h2>
        <p className="mt-3 text-sm text-text-secondary sm:text-base">
          {mode === "sign-in"
            ? "Continue to your day and study plans."
            : "Start with a calm view of what comes next."}
        </p>
      </div>

      <button
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-[13px] border border-border-strong bg-surface/70 px-4 font-semibold transition hover:-translate-y-px hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-55"
        type="button"
        onClick={continueWithGoogle}
        disabled={disabled}
      >
        <GoogleIcon />
        <span className="text-sm sm:text-base">{providerPending ? "Opening Google..." : "Continue with Google"}</span>
      </button>

      <div className="my-7 flex items-center gap-3.5 text-[11px] uppercase tracking-[0.04em] text-text-tertiary before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border"><span>or continue with email</span></div>

      <form className="grid gap-[17px]" onSubmit={submitEmail} noValidate>
        {mode === "sign-up" ? (
          <label className="grid gap-2 text-[13px] font-medium text-text-secondary">
            <span>Name</span>
            <input
              className="h-[49px] w-full rounded-xl border border-border bg-surface/65 px-4 text-text-primary outline-none transition placeholder:text-text-tertiary hover:border-border-strong focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-55"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              disabled={disabled}
              required
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-[13px] font-medium text-text-secondary">
          <span>Email</span>
          <input
            className="h-[49px] w-full rounded-xl border border-border bg-surface/65 px-4 text-text-primary outline-none transition placeholder:text-text-tertiary hover:border-border-strong focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-55"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={disabled}
            required
          />
        </label>

        <label className="grid gap-2 text-[13px] font-medium text-text-secondary">
          <span>Password</span>
          <input
            className="h-[49px] w-full rounded-xl border border-border bg-surface/65 px-4 text-text-primary outline-none transition placeholder:text-text-tertiary hover:border-border-strong focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-55"
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            placeholder="At least 8 characters"
            minLength={8}
            disabled={disabled}
            required
          />
        </label>

        {error ? <p className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-3 text-[13px] text-danger" role="alert">{error}</p> : null}

        <button className="mt-1 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[13px] border border-accent bg-accent px-4 font-semibold text-accent-foreground shadow-[0_10px_32px_var(--accent-soft)] transition hover:-translate-y-px hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-55 text-sm sm:text-base" type="submit" disabled={disabled}>
          {isPending
            ? "Please wait..."
            : mode === "sign-in" ? "Continue with email" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-text-secondary">
        {mode === "sign-in" ? "New to Zury?" : "Already have an account?"}{" "}
        <button
          className="inline-flex min-h-11 items-center cursor-pointer border-0 bg-transparent font-semibold text-text-primary transition hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-md px-1 disabled:cursor-not-allowed disabled:opacity-55"
          type="button"
          onClick={() => changeMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          disabled={disabled}
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>

      <p className="mx-auto mt-6 max-w-[340px] text-center text-[11px] leading-5 text-text-tertiary">
        By continuing, you agree to use Zury responsibly and acknowledge its
        privacy practices.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-[19px]" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.4 3-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.5H3.2a10 10 0 0 0 0 9.2L6.5 14Z" />
      <path fill="#EA4335" d="M12 6a5.4 5.4 0 0 1 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.2 7.5l3.3 2.6A5.8 5.8 0 0 1 12 6Z" />
    </svg>
  );
}

function toFriendlyError(message?: string): string {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("invalid") || normalized.includes("password")) {
    return "That email and password combination does not match.";
  }
  if (normalized.includes("already") || normalized.includes("exist")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  return "We couldn't continue just now. Please try again.";
}
