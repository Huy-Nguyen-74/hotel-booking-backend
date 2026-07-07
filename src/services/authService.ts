import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { findUsers } from "../repositories/userRepository";

type SafeUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function generateToken(user: SafeUser) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "1h" }
  );
}

export async function authenticateUser(email: string, password: string) {
  const users = await findUsers({ email });
  const user = users[0];

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.is_active) {
    throw new AppError("User account is inactive", 403);
  }

  const { password_hash, ...safeUser } = user;

  return {
    token: generateToken(safeUser),
    user: safeUser,
  };
}
