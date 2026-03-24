import Link from "next/link";
import { redirect } from "next/navigation";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { detectMoodKeyword } from "@/lib/gemini";
import { getMoodHistoryEntryById, insertMoodHistory } from "@/lib/history";
import { getSpotifyTokens } from "@/lib/spotify";
import { searchTracksByMood } from "@/lib/spotify-recommendation";


const fallbackEmoji = "🌿";

async function logout() {
  "use server";

  await clearSessionCookie();
  redirect("/login");
}

async function saveMood(formData: FormData) {
  "use server";

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const moodText = String(formData.get("mood") || "").trim();

  if (!moodText) {
    redirect("/mood?error=empty");
  }

  if (moodText.length > 1000) {
    redirect("/mood?error=too_long");
  }

  try {
    const moodKeyword = await detectMoodKeyword(moodText);

    let recommendedTracks: Array<{
      id: string;
      name: string;
      artist: string;
      url: string;
      image?: string | null;
    }> = [];

    try {
      recommendedTracks = await searchTracksByMood(moodKeyword);
    } catch (spotifyError) {
      console.error("Failed to fetch Spotify recommendations:", spotifyError);
    }

    const historyId = await insertMoodHistory({
      userId: session.id,
      moodText,
      moodKeyword,
      recommendedTracks,
    });

    redirect(
      `/mood?saved=1&keyword=${encodeURIComponent(moodKeyword)}&historyId=${historyId}`
    );
  } catch (error) {
    console.error("Failed to save mood:", error);
    redirect("/mood?error=save_failed");
  }
}

export default async function MoodPage({
  searchParams,
}: {
  searchParams?: {
    saved?: string;
    keyword?: string;
    historyId?: string;
    error?: string;
  };
}) {
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

  let savedEntry = null;
  const savedHistoryId = Number.parseInt(searchParams?.historyId ?? "", 10);
  const shouldLoadSavedEntry =
    searchParams?.saved === "1" && Number.isFinite(savedHistoryId) && savedHistoryId > 0;

  if (shouldLoadSavedEntry) {
    savedEntry = await getMoodHistoryEntryById({
      id: savedHistoryId,
      userId: session.id,
    });
  }

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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-6 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--emerald-dark)]">
                Moodify
              </p>
              <h1 className="font-display mt-3 text-3xl font-semibold md:text-5xl">
                Welcome back, {userProfile.name}.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--ink-soft)] md:text-base">
                Check in with your mood, save your thoughts, and turn how you
                feel into a more personal music experience.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              {isSpotifyConnected ? (
                <div className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Spotify connected
                </div>
              ) : (
                <Link
                  href="/api/spotify/login"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--emerald-dark)] transition hover:border-[color:var(--emerald)] hover:text-[color:var(--emerald)]"
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

              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 text-xs font-semibold uppercase tracking-[0.25em] text-red-700 transition hover:border-red-300 hover:bg-red-100"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-8 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--emerald-dark)]">
                  Daily check-in
                </p>
                <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
                  How are you feeling today?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                  Write a quick note about your mood, energy, or what’s been on
                  your mind.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-right md:block">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--emerald-dark)]">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {isSpotifyConnected
                    ? "Ready to recommend music"
                    : "Connect Spotify to continue"}
                </p>
              </div>
            </div>

            {searchParams?.saved === "1" && searchParams?.keyword ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Mood saved. Detected feeling: <strong>{searchParams.keyword}</strong>
              </div>
            ) : null}

            {savedEntry ? (
              <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--emerald-dark)]">
                  Recommended songs for this mood
                </p>

                {savedEntry.recommendedTracks.length === 0 ? (
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    No Spotify recommendations were returned for this mood.
                  </p>
                ) : (
                  <ul className="mt-3 grid gap-2">
                    {savedEntry.recommendedTracks.map((track) => (
                      <li
                        key={track.id}
                        className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 text-sm"
                      >
                        <p className="font-semibold">{track.name}</p>
                        <p className="text-[color:var(--ink-soft)]">{track.artist}</p>
                        <a
                          href={track.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--emerald-dark)] hover:text-[color:var(--emerald)]"
                        >
                          Open in Spotify
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {searchParams?.error === "empty" ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Please write something before saving your mood.
              </div>
            ) : null}

            {searchParams?.error === "too_long" ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Your mood note is too long.
              </div>
            ) : null}

            <form action={saveMood} className="mt-8">
              <label
                htmlFor="mood-input"
                className="block text-xs font-semibold uppercase tracking-[0.2em]"
              >
                Mood note
              </label>

              <textarea
                id="mood-input"
                name="mood"
                rows={7}
                className="mt-3 w-full rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-4 text-sm leading-6 outline-none transition placeholder:text-[color:var(--ink-soft)]/70 focus:border-[color:var(--emerald)] focus:ring-2 focus:ring-[color:var(--emerald)]/25"
                placeholder="I feel calm but energized after a long walk. I want something uplifting, soft, and focused..."
                maxLength={1000}
                required
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[color:var(--ink-soft)]">
                  Your entries are private by default.
                </p>

                <div className="flex gap-3">
                  <button
                    type="reset"
                    className="h-11 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--emerald)]"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="h-11 rounded-2xl bg-[color:var(--emerald)] px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--emerald-dark)]"
                  >
                    Save mood
                  </button>
                </div>
              </div>
            </form>
          </section>

          <aside className="grid gap-6">
            <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-6 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--emerald-dark)]">
                Your space
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--surface-strong)] text-2xl">
                  {userProfile.emoji}
                </div>
                <div>
                  <p className="text-lg font-semibold">{userProfile.name}</p>
                  <p className="text-sm text-[color:var(--ink-soft)]">
                    Personal mood dashboard
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--emerald-dark)]">
                    Music sync
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    {isSpotifyConnected
                      ? "Spotify is connected and ready for personalized recommendations."
                      : "Connect Spotify to turn your mood into tailored music suggestions."}
                  </p>
                </div>

                <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--emerald-dark)]">
                    Privacy
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    Your mood entries stay private unless you choose to share
                    them later.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/85 p-6 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--emerald-dark)]">
                Quick actions
              </p>
              <div className="mt-4 grid gap-3">
                {!isSpotifyConnected ? (
                  <Link
                    href="/api/spotify/login"
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--emerald)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--emerald-dark)]"
                  >
                    Connect Spotify
                  </Link>
                ) : null}

                <Link
                  href="/history"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 text-sm font-semibold transition hover:border-[color:var(--emerald)]"
                >
                  View mood history
                </Link>
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
