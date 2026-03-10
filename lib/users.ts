import bcrypt from "bcryptjs";
import { sql } from "./db";

const SALT_ROUNDS = 12;

type DbUser = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
};

export type PublicUser = {
  id: number;
  username: string;
  email: string;
};

export async function createUser(params: {
  username: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  const { username, email, password } = params;

  const existing = (await sql`
    SELECT id
    FROM users
    WHERE email = ${email} OR username = ${username}
    LIMIT 1
  `) as Array<Pick<DbUser, "id">>;

  if (existing.length > 0) {
    throw new Error("USER_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const rows = (await sql`
    INSERT INTO users (username, email, password_hash)
    VALUES (${username}, ${email}, ${passwordHash})
    RETURNING id, username, email
  `) as Array<Pick<DbUser, "id" | "username" | "email">>;

  const { id, username: returnedUsername, email: returnedEmail } = rows[0];
  return { id, username: returnedUsername, email: returnedEmail };
}

export async function loginUser(email: string, password: string) {
  const rows = (await sql`
    SELECT id, username, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `) as Array<Pick<DbUser, "id" | "username" | "password_hash">>;

  const user = rows[0];
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return { id: user.id, username: user.username };
}
