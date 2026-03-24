import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMoodHistoryByUserId } from "@/lib/history";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sl-SI", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function HistoryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const history = await getMoodHistoryByUserId(session.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="absolute inset-0 bg-mist" aria-hidden="true" />
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <header className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-6 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--emerald-dark)]">
                Moodify
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Your mood history</h1>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                Pregled preteklih vnosov in priporočenih pesmi.
              </p>
            </div>

            <Link
              href="/mood"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 text-sm font-semibold transition hover:border-[color:var(--emerald)]"
            >
              Back to dashboard
            </Link>
          </div>
        </header>

        <main className="mt-6">
          {history.length === 0 ? (
            <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-8 text-sm text-[color:var(--ink-soft)] shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur">
              Se ni shranjenih mood vnosov.
            </section>
          ) : (
            <div className="grid gap-4">
              {history.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-6 shadow-[0_24px_60px_-50px_rgba(6,30,18,0.8)] backdrop-blur"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--emerald-dark)]">
                      Mood: {item.moodKeyword}
                    </p>
                    <p className="text-xs text-[color:var(--ink-soft)]">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                    {item.moodText}
                  </p>

                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--emerald-dark)]">
                      Recommended songs
                    </p>
                    {item.recommendedTracks.length === 0 ? (
                      <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                        Za ta vnos ni shranjenih priporočil.
                      </p>
                    ) : (
                      <ul className="mt-3 grid gap-2">
                        {item.recommendedTracks.map((track) => (
                          <li
                            key={track.id}
                            className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3 text-sm"
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
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
