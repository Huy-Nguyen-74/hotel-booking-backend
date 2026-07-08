import pool from "../database/db";

export type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateUserRepositoryData = {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: "admin" | "staff";
  isActive: boolean;
};

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
    SELECT id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY id ASC
    `,
    values
  );

  return result.rows as UserRow[];
}

export async function findUserById(id: number) {
  const result = await pool.query(
    `
    SELECT id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  return (result.rows[0] as UserRow | undefined) ?? null;
}

export async function createUser(userData: CreateUserRepositoryData) {
  const { firstName, lastName, email, passwordHash, role, isActive } = userData;

  const result = await pool.query(
    `
    INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
    `,
    [firstName, lastName, email, passwordHash, role, isActive]
  );

  return result.rows[0] as UserRow;
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
    RETURNING id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
    `,
    [firstName, lastName, passwordHash, id]
  );

  return (result.rows[0] as UserRow | undefined) ?? null;
}

export async function updateUserInfo(
  id: number,
  firstName?: string,
  lastName?: string,
  role?: "admin" | "staff",
  isActive?: boolean
) {
  const result = await pool.query(
    `
    UPDATE users
    SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      role = COALESCE($3, role),
      is_active = COALESCE($4, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
    `,
    [firstName, lastName, role, isActive, id]
  );

  return (result.rows[0] as UserRow | undefined) ?? null;
}

export async function deactivateUserById(id: number) {
  const result = await pool.query(
    `
    UPDATE users
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
    `,
    [id]
  );

  return (result.rows[0] as UserRow | undefined) ?? null;
}
