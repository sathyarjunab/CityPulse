"use client";

import { CircleAlert, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Role } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ApiErrorBody } from "@/lib/api/response";
import { landingPathFor } from "@/lib/auth/redirect";
import { loginSchema, signupSchema } from "@/lib/validation/auth";
import { firstFieldErrors } from "@/lib/validation/errors";

type Mode = "login" | "signup";

const copy = {
  login: {
    title: "Welcome back 👋",
    subtitle: "Log in to see what's happening around you.",
    submit: "Log in",
    switchText: "New here?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Make it official ✨",
    subtitle:
      "Save events, set reminders and build a feed that's actually yours.",
    submit: "Create account",
    switchText: "Already have an account?",
    switchLabel: "Log in",
    switchHref: "/login",
  },
} satisfies Record<Mode, Record<string, string>>;

type Values = { email: string; password: string };
type AuthResponse = { token: string; user: { role: Role } };

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const text = copy[mode];
  const schema = mode === "login" ? loginSchema : signupSchema;

  const [values, setValues] = useState<Values>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Values>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  function update(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    const parsed = schema.shape[field].safeParse(value);
    setFieldErrors((current) => ({
      ...current,
      [field]: parsed.success ? undefined : parsed.error.issues[0]?.message,
    }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(firstFieldErrors(parsed.error));
      return;
    }

    setPending(true);
    setFormError(null);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await response.json().catch(() => null)) as
        | AuthResponse
        | ApiErrorBody
        | null;

      if (!response.ok || !body || "error" in body) {
        const error = body && "error" in body ? body.error : null;
        if (error?.fields) setFieldErrors(error.fields);
        else
          setFormError(
            error?.message ?? "Something went wrong on our side. Try again.",
          );
        setPending(false);
        return;
      }

      // Next keeps visited pages mounted (hidden), so clear the form before leaving.
      setValues({ email: "", password: "" });
      setShowPassword(false);
      setPending(false);
      router.replace(landingPathFor(body.user.role, next));
      router.refresh();
    } catch {
      setFormError(
        "Couldn't reach CityPulse. Check your connection and try again.",
      );
      setPending(false);
    }
  }

  const switchHref = next
    ? `${text.switchHref}?next=${encodeURIComponent(next)}`
    : text.switchHref;

  return (
    <div className="grid gap-7">
      <div className="grid gap-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{text.title}</h1>
        <p className="text-muted">{text.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid gap-5">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border-2 border-ink bg-danger/10 px-4 py-3 text-sm font-bold shadow-pop-danger"
          >
            <CircleAlert
              className="mt-0.5 size-4 shrink-0 text-danger"
              aria-hidden
            />
            {formError}
          </div>
        )}

        <Field id="email" label="Email" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
        </Field>

        <Field
          id="password"
          label="Password"
          error={fieldErrors.password}
          hint={mode === "signup" ? "At least 8 characters." : undefined}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder={
                mode === "login" ? "Your password" : "Make it a good one"
              }
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password
                  ? "password-error"
                  : mode === "signup"
                    ? "password-hint"
                    : undefined
              }
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="size-5" aria-hidden />
              ) : (
                <Eye className="size-5" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        <Button
          type="submit"
          size="lg"
          loading={pending}
          className="mt-1 w-full"
        >
          {pending ? "Hang tight…" : text.submit}
          {!pending && <ArrowRight className="size-5" aria-hidden />}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {text.switchText}{" "}
        <Link
          href={switchHref}
          className="font-bold text-ink underline decoration-2 underline-offset-4 hover:decoration-violet"
        >
          {text.switchLabel}
        </Link>
      </p>
    </div>
  );
}

export function AuthFormSkeleton() {
  return (
    <div className="grid animate-pulse gap-7" aria-hidden>
      <div className="grid gap-3">
        <div className="h-9 w-3/4 rounded-lg bg-ink/10" />
        <div className="h-4 w-full rounded bg-ink/10" />
      </div>
      <div className="grid gap-5">
        <div className="h-12 rounded-xl bg-ink/10" />
        <div className="h-12 rounded-xl bg-ink/10" />
        <div className="h-13 rounded-xl bg-ink/10" />
      </div>
    </div>
  );
}
