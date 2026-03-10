import { createHmac } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "moodify_session";

export type SessionPayload = {
  id: number;
  name: string;
  emoji?: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function signPayload(data: string) {
  return createHmac("sha256", getAuthSecret())
    .update(data)
    .digest("base64url");
}

export async function createSessionCookie(payload: SessionPayload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(data);
  const token = `${data}.${signature}`;

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const [data, signature] = token.split(".");
  if (!data || !signature) {
    return null;
  }

  const expectedSignature = signPayload(data);
  if (expectedSignature !== signature) {
    return null;
  }

  try {
    const decoded = Buffer.from(data, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded) as SessionPayload;
    if (!parsed?.id || !parsed?.name) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
