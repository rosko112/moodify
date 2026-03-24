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

type SpotifyPlaylistItem = {
  id: string;
  name: string;
};

type SpotifyPlaylistTrackItem = {
  track?: SpotifySearchTrackItem | null;
};

type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifySearchTrackItem[];
  };
  playlists?: {
    items?: SpotifyPlaylistItem[];
  };
};

type SpotifyPlaylistTracksResponse = {
  items?: SpotifyPlaylistTrackItem[];
};

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function mapTrack(track: SpotifySearchTrackItem): RecommendedTrack {
  return {
    id: track.id,
    name: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    url: track.external_urls?.spotify ?? "#",
    image: track.album?.images?.[0]?.url ?? null,
  };
}

function dedupeTracks(items: RecommendedTrack[]): RecommendedTrack[] {
  const unique = new Map<string, RecommendedTrack>();

  for (const track of items) {
    if (!unique.has(track.id)) {
      unique.set(track.id, track);
    }
  }

  return [...unique.values()];
}

async function spotifyFetchJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify request failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as T;
}

async function searchPlaylistsByMood(
  moodKeyword: string,
  accessToken: string,
  limit = 6
): Promise<SpotifyPlaylistItem[]> {
  const params = new URLSearchParams({
    q: moodKeyword,
    type: "playlist",
    limit: String(limit),
  });

  const data = await spotifyFetchJson<SpotifySearchResponse>(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    accessToken
  );

  return data.playlists?.items ?? [];
}

async function fetchTracksFromPlaylist(
  playlistId: string,
  accessToken: string,
  limit = 20
): Promise<RecommendedTrack[]> {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  const data = await spotifyFetchJson<SpotifyPlaylistTracksResponse>(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?${params.toString()}`,
    accessToken
  );

  const tracks = (data.items ?? [])
    .map((item) => item.track)
    .filter(
      (track): track is SpotifySearchTrackItem =>
        Boolean(
          track &&
            track.id &&
            track.name &&
            Array.isArray(track.artists) &&
            track.artists.length > 0
        )
    )
    .map(mapTrack);

  return tracks;
}

export async function searchTracksByMood(
  moodKeyword: string,
  limit = 20
): Promise<RecommendedTrack[]> {
  const accessToken = await getSpotifyAccessToken();

  if (!accessToken) {
    throw new Error("Spotify is not connected");
  }

  const playlists = await searchPlaylistsByMood(moodKeyword, accessToken, 8);
  const playlistsToUse = playlists.slice(0, 4);

  const playlistTrackGroups = await Promise.all(
    playlistsToUse.map((playlist) => fetchTracksFromPlaylist(playlist.id, accessToken, 20))
  );

  const playlistTracks = dedupeTracks(playlistTrackGroups.flat());

  if (playlistTracks.length > 0) {
    return shuffleArray(playlistTracks).slice(0, 6);
  }

  const trackParams = new URLSearchParams({
    q: moodKeyword,
    type: "track",
    limit: String(limit),
  });

  const trackSearchData = await spotifyFetchJson<SpotifySearchResponse>(
    `https://api.spotify.com/v1/search?${trackParams.toString()}`,
    accessToken
  );

  const tracks = (trackSearchData.tracks?.items ?? []).map(mapTrack);
  return shuffleArray(tracks).slice(0, 6);
}
