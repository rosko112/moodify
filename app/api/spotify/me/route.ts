import { NextResponse } from "next/server";
import { getSpotifyAccessToken } from "@/lib/spotify";

export async function GET() {
  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to Spotify" }, { status: 401 });
  }

  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
