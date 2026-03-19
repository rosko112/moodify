import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const SPOTIFY_STATE_COOKIE = "spotify_oauth_state";
const SPOTIFY_TOKENS_COOKIE = "spotify_tokens";

const SPOTIFY_STATE_TTL_MS = 10 * 60 * 1000;
const SPOTIFY_TOKENS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SPOTIFY_ACCESS_TOKEN_REFRESH_BUFFER_MS = 15_000;

const DEFAULT_SPOTIFY_SCOPES = ["user-read-email", "user-read-private"];

export type SpotifyTokens = {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_at: number;
  refresh_token?: string;
};

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
};

export type SpotifyProfile = {
  id: string;
  display_name: string | null;
  email?: string;
  country?: string;
  product?: string;
  images?: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getAuthSecret() {
  return getRequiredEnv("AUTH_SECRET");
}

function getSpotifyConfig() {
  return {
    clientId: getRequiredEnv("SPOTIFY_CLIENT_ID"),
    clientSecret: getRequiredEnv("SPOTIFY_CLIENT_SECRET"),
    redirectUri: getRequiredEnv("SPOTIFY_REDIRECT_URI"),
  };
}

function signPayload(data: string) {
  return createHmac("sha256", getAuthSecret()).update(data).digest("base64url");
}

function encodeSignedValue(value: unknown) {
  const data = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = signPayload(data);
  return `${data}.${signature}`;
}

function decodeSignedValue<T>(value: string): T | null {
  const [data, signature] = value.split(".");
  if (!data || !signature) {
    return null;
  }

  const expectedSignature = signPayload(data);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const decoded = Buffer.from(data, "base64url").toString("utf-8");
    return JSON.parse(decoded) as T;
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

function isValidSpotifyTokens(value: unknown): value is SpotifyTokens {
  if (!value || typeof value !== "object") {
    return false;
  }

  const tokens = value as Partial<SpotifyTokens>;

  return (
    typeof tokens.access_token === "string" &&
    typeof tokens.token_type === "string" &&
    typeof tokens.expires_at === "number" &&
    (tokens.scope === undefined || typeof tokens.scope === "string") &&
    (tokens.refresh_token === undefined || typeof tokens.refresh_token === "string")
  );
}

function getBasicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function parseSpotifyError(response: Response) {
  const text = await response.text();
  return `Spotify request failed: ${response.status} ${text}`;
}

export function buildSpotifyAuthUrl(scopes?: string[]) {
  const { clientId, redirectUri } = getSpotifyConfig();

  const state = randomBytes(16).toString("hex");
  const resolvedScopes =
    scopes && scopes.length > 0 ? scopes : DEFAULT_SPOTIFY_SCOPES;

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
  const cookieStore = await cookies();

  cookieStore.set(SPOTIFY_STATE_COOKIE, state, {
    ...getCookieOptions(),
    expires: new Date(Date.now() + SPOTIFY_STATE_TTL_MS),
  });
}

export async function readSpotifyState() {
  const cookieStore = await cookies();
  return cookieStore.get(SPOTIFY_STATE_COOKIE)?.value ?? null;
}

export async function clearSpotifyState() {
  const cookieStore = await cookies();

  cookieStore.set(SPOTIFY_STATE_COOKIE, "", {
    ...getCookieOptions(),
    expires: new Date(0),
  });
}

export async function setSpotifyTokens(tokens: SpotifyTokens) {
  const cookieStore = await cookies();

  cookieStore.set(SPOTIFY_TOKENS_COOKIE, encodeSignedValue(tokens), {
    ...getCookieOptions(),
    maxAge: SPOTIFY_TOKENS_MAX_AGE_SECONDS,
  });
}

export async function clearSpotifyTokens() {
  const cookieStore = await cookies();

  cookieStore.set(SPOTIFY_TOKENS_COOKIE, "", {
    ...getCookieOptions(),
    expires: new Date(0),
  });
}

export async function getSpotifyTokens() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(SPOTIFY_TOKENS_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  const decoded = decodeSignedValue<unknown>(rawValue);
  if (!isValidSpotifyTokens(decoded)) {
    return null;
  }

  return decoded;
}

async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const { clientId, clientSecret } = getSpotifyConfig();

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseSpotifyError(response));
  }

  return (await response.json()) as SpotifyTokenResponse;
}

export async function exchangeSpotifyCode(code: string): Promise<SpotifyTokens> {
  const { clientId, clientSecret, redirectUri } = getSpotifyConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseSpotifyError(response));
  }

  const result = (await response.json()) as SpotifyTokenResponse;

  return {
    access_token: result.access_token,
    token_type: result.token_type,
    scope: result.scope,
    expires_at: Date.now() + result.expires_in * 1000,
    refresh_token: result.refresh_token,
  };
}

export async function getSpotifyAccessToken() {
  const tokens = await getSpotifyTokens();

  if (!tokens) {
    return null;
  }

  const stillValid =
    tokens.expires_at > Date.now() + SPOTIFY_ACCESS_TOKEN_REFRESH_BUFFER_MS;

  if (stillValid) {
    return tokens.access_token;
  }

  if (!tokens.refresh_token) {
    await clearSpotifyTokens();
    return null;
  }

  try {
    const refreshed = await refreshSpotifyToken(tokens.refresh_token);

    const updatedTokens: SpotifyTokens = {
      access_token: refreshed.access_token,
      token_type: refreshed.token_type,
      scope: refreshed.scope ?? tokens.scope,
      expires_at: Date.now() + refreshed.expires_in * 1000,
      refresh_token: refreshed.refresh_token ?? tokens.refresh_token,
    };

    await setSpotifyTokens(updatedTokens);

    return updatedTokens.access_token;
  } catch (error) {
    console.error("Spotify token refresh failed:", error);
    await clearSpotifyTokens();
    return null;
  }
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
    throw new Error(await parseSpotifyError(response));
  }

  return (await response.json()) as SpotifyProfile;
}