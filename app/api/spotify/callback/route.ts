import { NextResponse } from "next/server";
import {
  clearSpotifyState,
  exchangeSpotifyCode,
  readSpotifyState,
  setSpotifyTokens,
} from "@/lib/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const storedState = await readSpotifyState();
  if (!storedState || storedState !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const tokens = await exchangeSpotifyCode(code);
  await setSpotifyTokens(tokens);
  await clearSpotifyState();

  return NextResponse.redirect(new URL("/mood", request.url));
}
