import Link from "next/link";
import { redirect } from "next/navigation";
import { createSessionCookie } from "@/lib/auth";
import { createUser } from "@/lib/users";

type SignupPageProps = {
  searchParams?: {
    error?: string;
  };
};

async function signup(formData: FormData) {
  "use server";

  const username = String(formData.get("username") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !email || !password) {
    redirect("/signup?error=Missing+fields");
  }

  try {
    const user = await createUser({ username, email, password });
    await createSessionCookie({ id: user.id, name: user.username, emoji: "🌿" });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_EXISTS") {
      redirect("/signup?error=Email+or+username+already+exists");
    }
    throw error;
  }

  redirect("/mood");
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const error = searchParams?.error;

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
            Create your Moodify account.
          </h1>
          <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
            Start your green routine today.
          </p>
          <form action={signup} className="mt-8 grid gap-4">
            <div className="grid gap-2">
              <label
                htmlFor="signup-name"
                className="text-xs font-semibold uppercase tracking-[0.2em]"
              >
                Name
              </label>
              <input
                id="signup-name"
                name="username"
                className="h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm outline-none transition focus:border-[color:var(--emerald)] focus:ring-2 focus:ring-[color:var(--emerald)]/25"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="signup-email"
                className="text-xs font-semibold uppercase tracking-[0.2em]"
              >
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                className="h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm outline-none transition focus:border-[color:var(--emerald)] focus:ring-2 focus:ring-[color:var(--emerald)]/25"
                type="email"
                placeholder="you@moodify.app"
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="signup-password"
                className="text-xs font-semibold uppercase tracking-[0.2em]"
              >
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                className="h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm outline-none transition focus:border-[color:var(--emerald)] focus:ring-2 focus:ring-[color:var(--emerald)]/25"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />
            </div>
            <button className="h-11 rounded-2xl bg-[color:var(--emerald)] text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--emerald-dark)]">
              Create account
            </button>
          </form>
          {error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <p className="mt-6 text-sm text-[color:var(--ink-soft)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[color:var(--emerald-dark)] hover:text-[color:var(--emerald)]"
            >
              Log in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
