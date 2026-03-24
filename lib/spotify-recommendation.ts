import { getSpotifyAccessToken } from "@/lib/spotify";

export type RecommendedTrack = {
  id: string;
  name: string;
  artist: string;
  url: string;
  image?: string | null;
};

type SpotifySearchTrackItem = {
  id: string;
  name: string;
  artists: { name: string }[];
  external_urls?: {
    spotify?: string;
  };
  album?: {
    images?: { url: string }[];
  };
};

type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifySearchTrackItem[];
  };
};

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export async function searchTracksByMood(
  moodKeyword: string,
  limit = 20
): Promise<RecommendedTrack[]> {
  const accessToken = await getSpotifyAccessToken();

  if (!accessToken) {
    throw new Error("Spotify is not connected");
  }

  const params = new URLSearchParams({
    q: moodKeyword,
    type: "track",
    limit: String(limit),
  });

  const response = await fetch(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify track search failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as SpotifySearchResponse;

  const tracks: RecommendedTrack[] = (data.tracks?.items ?? []).map((track) => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    url: track.external_urls?.spotify ?? "#",
    image: track.album?.images?.[0]?.url ?? null,
  }));

  return shuffleArray(tracks).slice(0, 6);
}