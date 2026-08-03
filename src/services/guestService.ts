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
import {
  updateBooking as RepositoryUpdateBooking,
  guestViewAllBookingHistory as repositoryGuestViewAllBookingHistory,
  guestViewOneSpecificBooking as repositoryGuestViewOneSpecificBooking
} from "../repositories/bookingRepository";
import { pool } from "../database/db";

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

export async function guestViewBookingHistory(guestUserId: number) {
  // Implementation for viewing booking history by a guest would go here
  const bookingHistory = await repositoryGuestViewAllBookingHistory(guestUserId);
  return bookingHistory;
}

export async function guestViewOneSpecificBooking(guestUserId: number, bookingId: number) {
  const booking = await repositoryGuestViewOneSpecificBooking(guestUserId, bookingId);
  return booking;
}

export async function guestUpdateTheirOwnBooking(guestUserId: number, bookingId: number, updates: {
  guestName?: string;
  checkInDate?: string;
  checkOutDate?: string;
}) {
  // Implementation for updating a booking by a guest would go here
  // This would typically involve checking if the booking belongs to the guest and then allowing updates to certain fields.
  
  const bookingCheck = await repositoryGuestViewOneSpecificBooking(guestUserId, bookingId);
  if (!bookingCheck || bookingCheck.length === 0) {
    throw new AppError("Booking not found", 404);
  }
  
  const effectiveCheckInDate = updates.checkInDate ? new Date(updates.checkInDate) : new Date(bookingCheck[0].check_in_date);
  const effectiveCheckOutDate = updates.checkOutDate ? new Date(updates.checkOutDate) : new Date(bookingCheck[0].check_out_date);

  if (effectiveCheckOutDate <= effectiveCheckInDate) {
    throw new AppError("checkOutDate must be after checkInDate", 400);
  }

  const effectiveNights = Math.ceil((effectiveCheckOutDate.getTime() - effectiveCheckInDate.getTime()) / (1000 * 60 * 60 * 24));
  if (effectiveNights <= 0) {
    throw new AppError("Number of nights must be greater than 0", 400);
  }

  const effectiveTotalPrice = effectiveNights * bookingCheck[0].room.price;
  if (effectiveTotalPrice <= 0) {
    throw new AppError("Total price must be greater than 0", 400);
  }

    /*
    How to check overlapping bookings: a booking overlaps if:
    - The new booking's check-in date is before or equal to an existing booking's check-out date AND
    - The new booking's check-out date is after or equal to an existing booking's check-in date.
    - We need to exclude the current booking from this check.
    */

    const overlappingBooking = await pool.query(
        `
        SELECT *
        FROM bookings
        WHERE room_id = $1
            AND check_in_date <= $2
            AND check_out_date >= $3
            AND id != $4
    `, [bookingCheck[0].room_id, effectiveCheckOutDate, effectiveCheckInDate, bookingId]);

    if (overlappingBooking.rows.length > 0) {
        throw new AppError("Room is already booked for the selected dates", 400);
    }

    return await RepositoryUpdateBooking(bookingId, {
        guestName: updates.guestName,
        checkInDate: effectiveCheckInDate.toISOString().split('T')[0],
        checkOutDate: effectiveCheckOutDate.toISOString().split('T')[0],
        nights: effectiveNights,
        totalPrice: effectiveTotalPrice
    });
}

// Guest cancelling their own booking is written below:





