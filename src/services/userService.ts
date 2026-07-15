import bcrypt from "bcrypt";
import { AppError } from "../errors/AppError";
import {
  createUser as repositoryCreateUser,
  deactivateUserById as repositoryDeactivateUserById,
  findUserById as repositoryFindUserById,
  findUsers as repositoryFindUsers,
  updateSelfInfo as repositoryUpdateSelfInfo,
  updateUserInfo as repositoryUpdateUserInfo,
} from "../repositories/userRepository";
import { CreateUserInput } from "../types/user";

function withoutPassword(user: { password_hash: string; [key: string]: unknown }) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}


// For createUser, admin can only create staff users. Admin users cannot be created through this service.
// However, in the future, if there are other roles that can be created by admin users, this service can be updated to allow for that. For now, it only allows for the creation of staff users.

export async function createUser(userData: CreateUserInput) {
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

export async function getUsers(filters: { id?: number; email?: string }) {
  const users = await repositoryFindUsers(filters);
  return users.map((user) => withoutPassword(user as unknown as { password_hash: string; [key: string]: unknown }));
}

export async function getSelfInfo(id: number) {
  const user = await repositoryFindUserById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return withoutPassword(user as unknown as { password_hash: string; [key: string]: unknown });
}

export async function deactivateUserById(id: number) {
  const user = await repositoryFindUserById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const deactivatedUser = await repositoryDeactivateUserById(id);
  if (!deactivatedUser) {
    throw new AppError("Failed to deactivate user", 500);
  }

  return withoutPassword(deactivatedUser as unknown as { password_hash: string; [key: string]: unknown });
}

export async function updateSelfInfo(id: number, firstName?: string, lastName?: string, password?: string) {
  const user = await repositoryFindUserById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
  const updatedUser = await repositoryUpdateSelfInfo(id, firstName, lastName, hashedPassword);

  return withoutPassword(updatedUser as unknown as { password_hash: string; [key: string]: unknown });
}

export async function updateUserInfo(
  id: number,
  firstName?: string,
  lastName?: string,
  isActive?: boolean
) {
  const user = await repositoryFindUserById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updatedUser = await repositoryUpdateUserInfo(id, firstName, lastName, isActive);

  return withoutPassword(updatedUser as unknown as { password_hash: string; [key: string]: unknown });
}
