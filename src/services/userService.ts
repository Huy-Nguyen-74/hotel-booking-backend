import bcrypt from "bcrypt";
import { AppError } from "../errors/AppError";
import {
  createUser as repositoryCreateUser,
  deactivateUserById as repositoryDeactivateUserById,
  findUserWithPasswordByEmail as repositoryFindUserWithPasswordByEmail,
  findUserById as repositoryFindUserById,
  findUsers as repositoryFindUsers,
  updateSelfInfo as repositoryUpdateSelfInfo,
  updateUserInfo as repositoryUpdateUserInfo,
} from "../repositories/userRepository";
import { CreateUserInput, SafeUser } from "../types/user";

// For createUser, admin can only create staff users. Admin users cannot be created through this service.
// However, in the future, if there are other roles that can be created by admin users, this service can be updated to allow for that. For now, it only allows for the creation of staff users.

export async function createUser(userData: CreateUserInput) {
  const existingUser = await repositoryFindUserWithPasswordByEmail(userData.email);
  if (existingUser) {
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

  return createdUser as SafeUser;
}

export async function getUsers(filters: { id?: number; email?: string }) {
  const users = await repositoryFindUsers(filters);
  return users as SafeUser[];
}

export async function getSelfInfo(id: number) {
  const user = await repositoryFindUserById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user as SafeUser;
}

export async function deactivateUserById(id: number) {
  const user = await repositoryFindUserById(id);
  if (!user || user?.is_active === false) {
    throw new AppError("User not found", 404);
  }

  const deactivatedUser = await repositoryDeactivateUserById(id);
  if (!deactivatedUser) {
    throw new AppError("Failed to deactivate user", 500);
  }

  return deactivatedUser as SafeUser;
}

export async function updateSelfInfo(id: number, firstName?: string, lastName?: string, password?: string) {
  const user = await repositoryFindUserById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
  const updatedUser = await repositoryUpdateSelfInfo(id, firstName, lastName, hashedPassword);

  return updatedUser as SafeUser;
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

  return updatedUser as SafeUser;
}
