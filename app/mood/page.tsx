import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSpotifyTokens } from "@/lib/spotify";

const fallbackEmoji = "🌿";

export default async function MoodPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const spotifyTokens = await getSpotifyTokens();
  const isSpotifyConnected = Boolean(spotifyTokens?.access_token);

  const userProfile = {
    name: session.name,
    emoji: session.emoji || fallbackEmoji,
  };

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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
        <header className="flex flex-col gap-4 rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-6 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--emerald-dark)]">
              Moodify
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold md:text-4xl">
              How are you feeling today?
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isSpotifyConnected ? (
              <div className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Spotify connected
              </div>
            ) : (
              <Link
                href="/api/spotify/login"
                className="inline-flex h-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--emerald-dark)] transition hover:border-[color:var(--emerald)] hover:text-[color:var(--emerald)]"
              >
                Connect Spotify
              </Link>
            )}
            <div className="flex items-center gap-3 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-2">
              <span className="text-xl" aria-hidden="true">
                {userProfile.emoji}
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--emerald-dark)]">
                  Signed in
                </p>
                <p className="text-sm font-semibold">{userProfile.name}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-10 grid gap-6">
          <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-8 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
            <p className="text-sm text-[color:var(--ink-soft)]">
              Drop a quick check-in. You can keep it short or write a full mood
              note.
            </p>
            <label
              htmlFor="mood-input"
              className="mt-6 block text-xs font-semibold uppercase tracking-[0.2em]"
            >
              Mood check-in
            </label>
            <textarea
              id="mood-input"
              rows={5}
              className="mt-3 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[color:var(--emerald)] focus:ring-2 focus:ring-[color:var(--emerald)]/25"
              placeholder="I feel calm but energized after a long walk..."
            />
            <button className="mt-6 h-11 rounded-2xl bg-[color:var(--emerald)] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--emerald-dark)]">
              Save mood
            </button>
          </section>

          <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-6 text-sm text-[color:var(--ink-soft)] shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
            Your mood entries are private by default. You can choose to share
            them later.
          </section>
        </main>
      </div>
    </div>
  );
}
