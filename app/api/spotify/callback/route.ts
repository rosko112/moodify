import { NextResponse } from "next/server";
import {
  clearSpotifyState,
  exchangeSpotifyCode,
  setSpotifyTokens,
  readSpotifyState,
} from "@/lib/spotify";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", url));
  }

  if (error) {
    await clearSpotifyState().catch(() => {});
    return NextResponse.redirect(
      new URL(`/mood?spotify_error=${encodeURIComponent(error)}`, url)
    );
  }

  if (!code || !state) {
    await clearSpotifyState().catch(() => {});
    return NextResponse.redirect(
      new URL("/mood?spotify_error=missing_code_or_state", url)
    );
  }

  try {
    const storedState = await readSpotifyState();

    if (!storedState || storedState !== state) {
      await clearSpotifyState().catch(() => {});
      return NextResponse.redirect(
        new URL("/mood?spotify_error=invalid_state", url)
      );
    }

    const tokens = await exchangeSpotifyCode(code);

    await setSpotifyTokens(tokens);
    await clearSpotifyState();

    return NextResponse.redirect(new URL("/mood", url));
  } catch (err) {
    console.error("Spotify callback failed:", err);
    await clearSpotifyState().catch(() => {});

    return NextResponse.redirect(
      new URL("/mood?spotify_error=callback_failed", url)
    );
  }
}