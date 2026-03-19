import { NextResponse } from "next/server";
import { getSpotifyAccessToken } from "@/lib/spotify";

export async function GET() {
  try {
    const accessToken = await getSpotifyAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not connected to Spotify" },
        { status: 401 }
      );
    }

    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Failed to fetch Spotify profile" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Spotify profile route failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}