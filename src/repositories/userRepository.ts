import pool from "../database/db";
import { SafeUser, UserRow, DbStoreUserData } from "../types/user";

export async function findUserWithPasswordByEmail(email: string) {
  const result = await pool.query(
    `SELECT id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
  return (result.rows[0] as UserRow | undefined) ?? null;
}

export async function storePasswordResetToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date
) {
  await pool.query(
    `
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id)
    DO UPDATE SET
      token_hash = EXCLUDED.token_hash,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW()
    `,
    [userId, tokenHash, expiresAt]
  );
}

export async function findUserIdByPasswordResetToken(tokenHash: string) {
  const result = await pool.query(
    `
    SELECT user_id, expires_at
    FROM password_reset_tokens
    WHERE token_hash = $1
    `,
    [tokenHash]
  );
  return result.rows[0] as { user_id: number; expires_at: Date } | undefined ?? null;
}

export async function deletePasswordResetToken(tokenHash: string) {
  await pool.query(
    `
    DELETE FROM password_reset_tokens
    WHERE token_hash = $1
    `,
    [tokenHash]
  );
}

export async function findUsers(filters: { id?: number; email?: string }) {
  const values: Array<string | number> = [];
  const conditions: string[] = [];

  if (filters.id !== undefined) {
    values.push(filters.id);
    conditions.push(`id = $${values.length}`);
  }

  if (filters.email !== undefined) {
    values.push(filters.email);
    conditions.push(`LOWER(email) = LOWER($${values.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
    SELECT id, first_name, last_name, email, role, is_active, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY id ASC
    `,
    values
  );

  return result.rows as SafeUser[];
}

export async function findUserById(id: number) {
  const result = await pool.query(
    `
    SELECT id, first_name, last_name, email, role, is_active, created_at, updated_at
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  return (result.rows[0] as SafeUser | undefined) ?? null;
}

export async function validateGuestUserExists(guestUserId: number) {
  const result = await pool.query(
    `SELECT id, role FROM users WHERE id = $1`,
    [guestUserId]
  );
  return (result.rows[0] as { id: number; role: string } | undefined) ?? null;
}

export async function createUser(userData: DbStoreUserData) {
  const { firstName, lastName, email, passwordHash, role, isActive } = userData;

  const result = await pool.query(
    `
    INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, first_name, last_name, email, role, is_active, created_at, updated_at
    `,
    [firstName, lastName, email, passwordHash, role, isActive]
  );

  return result.rows[0] as SafeUser;
}

export async function updateSelfInfo(
  id: number,
  firstName?: string,
  lastName?: string,
  passwordHash?: string
) {
  const result = await pool.query(
    `
    UPDATE users
    SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      password_hash = COALESCE($3, password_hash),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING id, first_name, last_name, email, role, is_active, created_at, updated_at
    `,
    [firstName, lastName, passwordHash, id]
  );

  return (result.rows[0] as SafeUser | undefined) ?? null;
}

export async function updateUserInfo(
  id: number,
  firstName?: string,
  lastName?: string,
  isActive?: boolean
) {
  const result = await pool.query(
    `
    UPDATE users
    SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      is_active = COALESCE($3, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING id, first_name, last_name, email, role, is_active, created_at, updated_at
    `,
    [firstName, lastName, isActive, id]
  );

  return (result.rows[0] as SafeUser | undefined) ?? null;
}

export async function deactivateUserById(id: number) {
  const result = await pool.query(
    `
    UPDATE users
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, first_name, last_name, email, role, is_active, created_at, updated_at
    `,
    [id]
  );

  return (result.rows[0] as SafeUser | undefined) ?? null;
}
