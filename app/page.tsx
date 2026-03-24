import Link from "next/link";

export default function Home() {
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

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--emerald-dark)]">
              Moodify
            </p>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              Track your mood. Find your next song.
            </h1>
            <p className="mt-4 text-base text-[color:var(--ink-soft)] md:text-lg">
              Keep your focus on the vibes. Log in to your dashboard or create an
              account in under a minute.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              "Encrypted sessions",
              "Daily mood prompts",
              "Smart playlists",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)]/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--emerald-dark)]"
              >
                {item}
              </span>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-8 shadow-[0_30px_80px_-60px_rgba(6,30,18,0.8)] backdrop-blur">
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              Welcome back to a calmer feed.
            </h2>
            <p className="mt-4 text-[color:var(--ink-soft)]">
              Moodify brings green energy to your daily listening. Track your
              mood, build playlists, and keep the noise out.
            </p>
            <div className="mt-8 grid gap-4">
              {[
                {
                  title: "1. Personalize",
                  text: "Pick a tone, we curate the soundtrack.",
                },
                {
                  title: "2. Reflect",
                  text: "Quick check-ins keep your mood visible.",
                },
                {
                  title: "3. Flow",
                  text: "Your focus stays on what feels right.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--emerald-dark)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="grid gap-6">
            <div className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-6 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
              <h3 className="font-display text-xl font-semibold">Log in</h3>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                Pick up where you left off.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--emerald)] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--emerald-dark)]"
              >
                Go to login
              </Link>
            </div>

            <div className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-6 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
              <h3 className="font-display text-xl font-semibold">Sign up</h3>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                Start your green routine today.
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--emerald)] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--emerald-dark)]"
              >
                Create account
              </Link>
              <p className="mt-4 text-xs text-[color:var(--ink-soft)]">
                By creating an account, you agree to our Terms and Privacy.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
