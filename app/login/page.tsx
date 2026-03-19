import Link from "next/link";
import { redirect } from "next/navigation";
import { createSessionCookie } from "@/lib/auth";
import { loginUser } from "@/lib/users";
import { LoginSubmitButton } from "./submit-button";

type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

const initialState: LoginState = {};

async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  "use server";

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const fieldErrors: LoginState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Password is required.";
  } else if (password.length < 6) {
    fieldErrors.password = "Password must be at least 6 characters.";
  }

  if (fieldErrors.email || fieldErrors.password) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    const user = await loginUser(email, password);

    if (!user) {
      return {
        error: "Invalid email or password.",
      };
    }

    await createSessionCookie({
      id: user.id,
      name: user.username,
      emoji: "🌿",
    });
  } catch (error) {
    console.error("Login failed:", error);
    return {
      error: "Something went wrong while signing you in. Please try again.",
    };
  }

  redirect("/mood");
}

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="absolute inset-0 bg-mist" aria-hidden="true" />
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
      <div
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-36 right-0 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
        <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-8 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--emerald-dark)]">
            Moodify
          </p>
          <h1 className="font-display mt-4 text-3xl font-semibold md:text-4xl">
            Log in to your calm space.
          </h1>
          <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
            Pick up where you left off.
          </p>

          <LoginForm action={loginAction} />

          <p className="mt-6 text-sm text-[color:var(--ink-soft)]">
            New here?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[color:var(--emerald-dark)] hover:text-[color:var(--emerald)]"
            >
              Create an account
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}