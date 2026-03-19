"use client";

import { useActionState } from "react";
import { LoginSubmitButton } from "./submit-button";

type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

const initialState: LoginState = {};

function inputClass(hasError?: boolean) {
  return [
    "h-11 rounded-2xl border bg-[color:var(--surface)] px-4 text-sm outline-none transition",
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border-[color:var(--line)] focus:border-[color:var(--emerald)] focus:ring-2 focus:ring-[color:var(--emerald)]/25",
  ].join(" ");
}

export function LoginForm({
  action,
}: {
  action: (
    prevState: LoginState,
    formData: FormData
  ) => Promise<LoginState>;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 grid gap-4" noValidate>
      <div className="grid gap-2">
        <label
          htmlFor="login-email"
          className="text-xs font-semibold uppercase tracking-[0.2em]"
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="you@moodify.app"
          autoComplete="email"
          aria-invalid={!!state.fieldErrors?.email}
          aria-describedby={state.fieldErrors?.email ? "login-email-error" : undefined}
          className={inputClass(!!state.fieldErrors?.email)}
          required
        />
        {state.fieldErrors?.email ? (
          <p id="login-email-error" className="text-sm text-red-600">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="login-password"
          className="text-xs font-semibold uppercase tracking-[0.2em]"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          placeholder="Your secret"
          autoComplete="current-password"
          aria-invalid={!!state.fieldErrors?.password}
          aria-describedby={
            state.fieldErrors?.password ? "login-password-error" : undefined
          }
          className={inputClass(!!state.fieldErrors?.password)}
          required
        />
        {state.fieldErrors?.password ? (
          <p id="login-password-error" className="text-sm text-red-600">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <LoginSubmitButton />

      {state.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}