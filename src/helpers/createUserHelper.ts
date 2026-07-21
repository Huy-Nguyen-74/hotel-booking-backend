import pool from "../database/db";
import { AppError } from "../errors/AppError";
import bcrypt from "bcrypt";
import type { SafeUser, CreateUserInput } from "../types/user";

export async function createAdminUserForTest(userData: CreateUserInput): Promise<SafeUser> {
  const existingUser = await pool.query(
    `
    SELECT * FROM users WHERE email = $1
    `,
    [userData.email.toLowerCase()]
  );
  if (existingUser.rows.length > 0) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const createdUser = await pool.query(
    `
    INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, 'admin', true)
    RETURNING id, first_name, last_name, email, role, is_active, created_at, updated_at
    `,
    [userData.firstName, userData.lastName, userData.email.toLowerCase(), hashedPassword]
  )
  
  return createdUser.rows[0] as SafeUser;
}

export async function createStaffUserForTest(userData: CreateUserInput): Promise<SafeUser> {
  const existingUser = await pool.query(
    `
    SELECT * FROM users WHERE email = $1
    `,
    [userData.email.toLowerCase()]
  );
  if (existingUser.rows.length > 0) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const createdUser = await pool.query(
    `
    INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, 'staff', true)
    RETURNING id, first_name, last_name, email, role, is_active, created_at, updated_at
    `,
    [userData.firstName, userData.lastName, userData.email.toLowerCase(), hashedPassword]
  )

  return createdUser.rows[0] as SafeUser;
}
