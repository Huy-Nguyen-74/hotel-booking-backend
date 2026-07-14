import type { UserRow } from "../repositories/userRepository";
import { pool } from "../database/db";

export async function createAdminUserForTest(firstName: string, lastName: string, email: string, password: string): Promise<UserRow> {
  return pool.query(
    `
    INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, 'admin', true)
    RETURNING id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
    `,
    [firstName, lastName, email.toLowerCase(), password]
  ).then(result => result.rows[0] as UserRow);
}

export async function createStaffUserForTest(firstName: string, lastName: string, email: string, password: string): Promise<UserRow> {
  return pool.query(
    `
    INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, 'staff', true)
    RETURNING id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at
    `,
    [firstName, lastName, email.toLowerCase(), password]
  ).then(result => result.rows[0] as UserRow);
}

