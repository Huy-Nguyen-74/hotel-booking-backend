// First, guest registration

import bcrypt from "bcrypt";
import { AppError } from "../errors/AppError";
import { CreateUserInput } from "../types/user";
import {
  createUser as repositoryCreateUser,
  findUsers as repositoryFindUsers,
} from "../repositories/userRepository";
import { findAvailableRooms } from "../repositories/roomRepository";

export async function createGuest(userData: CreateUserInput) {
  const existingUser = await repositoryFindUsers({ email: userData.email });
  if (existingUser.length > 0) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const createdUser = await repositoryCreateUser({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    passwordHash: hashedPassword,
    role: "guest",
    isActive: true,
  });

  return createdUser;
}

// Guest viewing their own information is handled by the getSelfInfo function in userService.ts, which retrieves the user's information based on their ID.

// Guest updating their own information is handled by the updateSelfInfo function in userService.ts, which allows the guest to update their own information based on their ID.

export async function searchAvailableRooms(filters: {
  hotelId?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  checkInDate?: string;
  checkOutDate?: string;
}) {

  /*
  Validation for checkInDate and checkOutDate:
  -If either checkInDate or checkOutDate is provided, both must be provided.
  -If neither is provided, it's okay.
  */

  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    throw new AppError("minPrice cannot be greater than maxPrice", 400);
  }

  if ((filters.checkInDate !== undefined && filters.checkOutDate === undefined) || (filters.checkInDate === undefined && filters.checkOutDate !== undefined)) {
    throw new AppError("Both checkInDate and checkOutDate must be provided together", 400);
  }

  if (filters.checkInDate && filters.checkOutDate && new Date(filters.checkInDate) >= new Date(filters.checkOutDate)) {
    throw new AppError("checkInDate must be before checkOutDate", 400);
  }
  
  const availableRooms = await findAvailableRooms(filters);
  return availableRooms;
}








