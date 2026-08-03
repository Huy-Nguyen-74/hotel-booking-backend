// First, guest registration

import bcrypt from "bcrypt";
import { AppError } from "../errors/AppError";
import { CreateUserInput } from "../types/user";
import {
  createUser as repositoryCreateUser,
  findUsers as repositoryFindUsers,
} from "../repositories/userRepository";
import { CreateBookingInput } from "../types/booking";
import { createBooking as serviceCreateBooking } from "./bookingService";

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

// For guest login, we will use the authenticateUser function from authService.ts, which handles the authentication process and returns a JWT token upon successful login.
// As such, no need to duplicate the login logic here.

// Guest viewing their own information is handled by the getSelfInfo function in userService.ts, which retrieves the user's information based on their ID.

// Guest updating their own information is handled by the updateSelfInfo function in userService.ts, which allows the guest to update their own information based on their ID.

// For get Hotel details, we can use the getHotels function from hotelService.ts, which retrieves hotel information based on provided filters.

// For searching available rooms, we can simply use the room Router's GET /available-rooms endpoint, which internally calls the searchAvailableRooms function from roomService.ts. This function retrieves available rooms based on provided filters such as hotelId, type, price range, and check-in/check-out dates.

export async function guestCreateBooking(bookingData: CreateBookingInput) {
  // Implementation for creating a booking by a guest would go here

  // Importing createBooking from services/bookingService.ts
  const createdBooking = await serviceCreateBooking(bookingData);
  return createdBooking;
}
