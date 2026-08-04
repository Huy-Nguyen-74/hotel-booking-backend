// First, guest registration

import bcrypt from "bcrypt";
import { AppError } from "../errors/AppError";
import { CreateUserInput } from "../types/user";
import {
  createUser as repositoryCreateUser,
  findUsers as repositoryFindUsers,
  validateGuestUserExists as repositoryValidateGuestUserExists,
} from "../repositories/userRepository";
import { CreateBookingInput } from "../types/booking";
import { createBooking as serviceCreateBooking } from "./bookingService";
import {
  updateBooking as RepositoryUpdateBooking,
  cancelBooking,
  checkOverlappingBookings,
  guestViewAllBookingHistory as repositoryGuestViewAllBookingHistory,
  guestViewOneSpecificBooking as repositoryGuestViewOneSpecificBooking
} from "../repositories/bookingRepository";

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

export async function guestViewAllBookingHistory(guestUserId: number) {
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

    const overlappingBooking = await checkOverlappingBookings(
        bookingCheck[0].room_id,
        effectiveCheckInDate.toISOString().split('T')[0],
        effectiveCheckOutDate.toISOString().split('T')[0],
        bookingId
    );

    if (overlappingBooking.length > 0) {
        throw new AppError("Room is already booked for the selected dates", 409);
    }

    return await RepositoryUpdateBooking(bookingId, {
        guestName: updates.guestName,
        checkInDate: effectiveCheckInDate.toISOString().split('T')[0],
        checkOutDate: effectiveCheckOutDate.toISOString().split('T')[0],
        nights: effectiveNights,
        totalPrice: effectiveTotalPrice
    });
}

/*
Guest cancelling their own booking is written below:

- Add `cancelOwnBooking(bookingId, guestUserId)`
- Find the booking
- Verify `guest_user_id === guestUserId`
- Reject invalid cancellation states
- Call the repository cancellation function
*/

export async function cancelOwnBooking(bookingId: number, guestUserId: number) {
  const booking = await repositoryGuestViewOneSpecificBooking(guestUserId, bookingId);
  if (!booking || booking.length === 0) {
    throw new AppError("Booking not found", 404);
  }

  if (booking[0].guest_user_id !== guestUserId) {
    throw new AppError("You are not authorized to cancel this booking", 403);
  }

  if (booking[0].status === "cancelled") {
    throw new AppError("Booking is already cancelled", 400);
  }

  const today = new Date();
  if (today > new Date(booking[0].check_in_date)) {
    throw new AppError("Cannot cancel a booking past its check-in date", 400);
  }

  const cancelledBooking = await cancelBooking(bookingId, guestUserId);
  return cancelledBooking;
}



