import { sql } from "@/lib/db";

export type RecommendedTrack = {
  id: string;
  name: string;
  artist: string;
  url: string;
  image?: string | null;
};

export async function insertMoodHistory(params: {
  userId: number;
  moodText: string;
  moodKeyword: string;
  recommendedTracks: RecommendedTrack[];
}) {
  const { userId, moodText, moodKeyword, recommendedTracks } = params;

  await sql`
    INSERT INTO history (user_id, mood_text, mood_keyword, recommended_tracks)
    VALUES (
      ${userId},
      ${moodText},
      ${moodKeyword},
      ${JSON.stringify(recommendedTracks)}::jsonb
    )
  `;
}