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
