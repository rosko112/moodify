import { sql } from "@/lib/db";

export type RecommendedTrack = {
  id: string;
  name: string;
  artist: string;
  url: string;
  image?: string | null;
};

export type MoodHistoryEntry = {
  id: number;
  userId: number;
  moodText: string;
  moodKeyword: string;
  recommendedTracks: RecommendedTrack[];
  createdAt: string;
};

type RawMoodHistoryRow = {
  id: number;
  user_id: number;
  mood_text: string;
  mood_keyword: string;
  recommended_tracks: unknown;
  created_at: string;
};

type RawInsertedIdRow = {
  id: number;
};

function parseRecommendedTracks(value: unknown): RecommendedTrack[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseRecommendedTracks(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((track): track is RecommendedTrack => {
      if (!track || typeof track !== "object") {
        return false;
      }

      const candidate = track as Partial<RecommendedTrack>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.artist === "string" &&
        typeof candidate.url === "string"
      );
    })
    .map((track) => ({
      ...track,
      image: track.image ?? null,
    }));
}

function mapRowToMoodHistoryEntry(row: RawMoodHistoryRow): MoodHistoryEntry {
  return {
    id: row.id,
    userId: row.user_id,
    moodText: row.mood_text,
    moodKeyword: row.mood_keyword,
    recommendedTracks: parseRecommendedTracks(row.recommended_tracks),
    createdAt: row.created_at,
  };
}

export async function insertMoodHistory(params: {
  userId: number;
  moodText: string;
  moodKeyword: string;
  recommendedTracks: RecommendedTrack[];
}): Promise<number> {
  const { userId, moodText, moodKeyword, recommendedTracks } = params;

  const rows = (await sql`
    INSERT INTO user_history (user_id, mood_text, mood_keyword, recommended_tracks)
    VALUES (
      ${userId},
      ${moodText},
      ${moodKeyword},
      ${JSON.stringify(recommendedTracks)}::jsonb
    )
    RETURNING id
  `) as RawInsertedIdRow[];

  const insertedId = rows[0]?.id;

  if (!insertedId) {
    throw new Error("Failed to insert mood history");
  }

  return insertedId;
}

export async function getMoodHistoryByUserId(userId: number): Promise<MoodHistoryEntry[]> {
  const rows = (await sql`
    SELECT
      id,
      user_id,
      mood_text,
      mood_keyword,
      recommended_tracks,
      created_at
    FROM user_history
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as RawMoodHistoryRow[];

  return rows.map(mapRowToMoodHistoryEntry);
}

export async function getLatestMoodHistoryEntryByUserId(
  userId: number
): Promise<MoodHistoryEntry | null> {
  const rows = (await sql`
    SELECT
      id,
      user_id,
      mood_text,
      mood_keyword,
      recommended_tracks,
      created_at
    FROM user_history
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `) as RawMoodHistoryRow[];

  const row = rows[0];
  if (!row) {
    return null;
  }

  return mapRowToMoodHistoryEntry(row);
}

export async function getMoodHistoryEntryById(params: {
  id: number;
  userId: number;
}): Promise<MoodHistoryEntry | null> {
  const rows = (await sql`
    SELECT
      id,
      user_id,
      mood_text,
      mood_keyword,
      recommended_tracks,
      created_at
    FROM user_history
    WHERE id = ${params.id} AND user_id = ${params.userId}
    LIMIT 1
  `) as RawMoodHistoryRow[];

  const row = rows[0];
  if (!row) {
    return null;
  }

  return mapRowToMoodHistoryEntry(row);
}
