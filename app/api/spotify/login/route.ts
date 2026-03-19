import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildSpotifyAuthUrl, setSpotifyState } from "@/lib/spotify";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { url, state } = buildSpotifyAuthUrl();
    await setSpotifyState(state);

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Failed to start Spotify login:", error);

    return NextResponse.redirect(
      new URL("/mood?spotify_error=login_start_failed", request.url)
    );
  }
}