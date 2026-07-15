import type { UserRow } from "../repositories/userRepository";
import pool from "../database/db";

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

userData: CreateUserInput) {
  const existingUser = await repositoryFindUsers({ email: userData.email });
  if (existingUser.length > 0) {
    throw new AppError("Email already exists", 409);
  }

  if (userData.role !== "staff") {
    throw new AppError("Only staff users can be created", 400);
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const createdUser = await repositoryCreateUser({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    passwordHash: hashedPassword,
    role: "staff",
    isActive: true,
  });

  return withoutPassword(createdUser as unknown as { password_hash: string; [key: string]: unknown });
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

