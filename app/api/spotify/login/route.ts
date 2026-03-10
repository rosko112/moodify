import { NextResponse } from "next/server";
import { buildSpotifyAuthUrl, setSpotifyState } from "@/lib/spotify";

export async function GET() {
  const { url, state } = buildSpotifyAuthUrl();
  await setSpotifyState(state);
  return NextResponse.redirect(url);
}
