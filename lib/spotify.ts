import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_STATE_COOKIE = "spotify_oauth_state";
const SPOTIFY_TOKENS_COOKIE = "spotify_tokens";
const DEFAULT_SPOTIFY_SCOPES = ["user-read-email", "user-read-private"];

export type SpotifyTokens = {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_at: number;
  refresh_token?: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function signPayload(data: string) {
  return createHmac("sha256", getAuthSecret()).update(data).digest("base64url");
}

function getSpotifyConfig() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Spotify env vars missing: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI"
    );
  }

  return { clientId, clientSecret, redirectUri };
}

function encodeTokenCookie(tokens: SpotifyTokens) {
  const data = Buffer.from(JSON.stringify(tokens)).toString("base64url");
  const signature = signPayload(data);
  return `${data}.${signature}`;
}

function decodeTokenCookie(value: string): SpotifyTokens | null {
  const [data, signature] = value.split(".");
  if (!data || !signature) {
    return null;
  }

  if (signPayload(data) !== signature) {
    return null;
  }

  try {
    const decoded = Buffer.from(data, "base64url").toString("utf-8");
    return JSON.parse(decoded) as SpotifyTokens;
  } catch {
    return null;
  }
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function buildSpotifyAuthUrl(scopes?: string[]) {
  const { clientId, redirectUri } = getSpotifyConfig();
  const state = randomBytes(16).toString("hex");
  const resolvedScopes = scopes && scopes.length > 0 ? scopes : DEFAULT_SPOTIFY_SCOPES;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  if (resolvedScopes.length > 0) {
    params.set("scope", resolvedScopes.join(" "));
  }

  return {
    url: `${SPOTIFY_AUTH_URL}?${params.toString()}`,
    state,
  };
}

export async function setSpotifyState(state: string) {
  (await cookies()).set(SPOTIFY_STATE_COOKIE, state, {
    ...getCookieOptions(),
    expires: new Date(Date.now() + 10 * 60 * 1000),
  });
}

export async function readSpotifyState() {
  return (await cookies()).get(SPOTIFY_STATE_COOKIE)?.value ?? null;
}

export async function clearSpotifyState() {
  (await cookies()).set(SPOTIFY_STATE_COOKIE, "", {
    ...getCookieOptions(),
    expires: new Date(0),
  });
}

export async function setSpotifyTokens(tokens: SpotifyTokens) {
  (await cookies()).set(SPOTIFY_TOKENS_COOKIE, encodeTokenCookie(tokens), {
    ...getCookieOptions(),
  });
}

export async function clearSpotifyTokens() {
  (await cookies()).set(SPOTIFY_TOKENS_COOKIE, "", {
    ...getCookieOptions(),
    expires: new Date(0),
  });
}

export async function getSpotifyTokens() {
  const value = (await cookies()).get(SPOTIFY_TOKENS_COOKIE)?.value;
  if (!value) {
    return null;
  }

  return decodeTokenCookie(value);
}

async function refreshSpotifyToken(refreshToken: string) {
  const { clientId, clientSecret } = getSpotifyConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      )}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify token refresh failed: ${response.status} ${error}`);
  }

  return (await response.json()) as {
    access_token: string;
    token_type: string;
    scope?: string;
    expires_in: number;
    refresh_token?: string;
  };
}

export async function exchangeSpotifyCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getSpotifyConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      )}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify token exchange failed: ${response.status} ${error}`);
  }

  const result = (await response.json()) as {
    access_token: string;
    token_type: string;
    scope?: string;
    expires_in: number;
    refresh_token?: string;
  };

  return {
    access_token: result.access_token,
    token_type: result.token_type,
    scope: result.scope,
    expires_at: Date.now() + result.expires_in * 1000,
    refresh_token: result.refresh_token,
  } satisfies SpotifyTokens;
}

export async function getSpotifyAccessToken() {
  const tokens = await getSpotifyTokens();
  if (!tokens) {
    return null;
  }

  if (tokens.expires_at > Date.now() + 15_000) {
    return tokens.access_token;
  }

  if (!tokens.refresh_token) {
    return null;
  }

  const refreshed = await refreshSpotifyToken(tokens.refresh_token);
  const updated: SpotifyTokens = {
    access_token: refreshed.access_token,
    token_type: refreshed.token_type,
    scope: refreshed.scope ?? tokens.scope,
    expires_at: Date.now() + refreshed.expires_in * 1000,
    refresh_token: refreshed.refresh_token ?? tokens.refresh_token,
  };

  await setSpotifyTokens(updated);
  return updated.access_token;
}

export async function getSpotifyProfile(accessToken?: string) {
  const token = accessToken ?? (await getSpotifyAccessToken());
  if (!token) {
    return null;
  }

  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify profile fetch failed: ${response.status} ${error}`);
  }

  return (await response.json()) as unknown;
}
