import {
    findBookings,
    createBooking as RepositoryCreateBooking,
    updateBooking as RepositoryUpdateBooking,
    deleteBooking as RepositoryDeleteBooking
} from "../repositories/bookingRepository";

import { findHotels } from "../repositories/hotelRepository";
import { findRooms } from "../repositories/roomRepository";
import { AppError } from "../errors/AppError";

import pool from "../database/db";
import { CreateBookingInput } from "../types/booking";

export async function getBookings(filters: { 
    hotelId?: number;
    roomId?: number;
    guestName?: string;
    checkInDate?: string;
    checkOutDate?: string;
}) {
    return await findBookings(filters);
}   

export async function getBookingById(bookingId: number) {
    const bookings = await findBookings({ bookingId });
    return bookings[0] ?? null;
}

/*
POST /bookings:
- Validate the request body to ensure all required fields are present and of the correct type. If not, return 400 Bad Request.
- Check if the specified hotel and room exist. If not, return 404 Not Found.
- Check if the room is available for the specified date range. If not, return 409 Conflict.
- If all validations pass, create the booking and return the created booking with a 201 Created status.

Further notes:
-Nights should not be filled in by the user, but should be calculated based on the check-in and check-out dates.
-Total price should not be filled in by the user, but should be calculated based on the room price and the number of nights.
-Nights > 0, and total price > 0. If not, return 400 Bad Request.
-Checkout date must be after check-in date. If not, return 400 Bad Request.
*/


export async function createBooking(booking: CreateBookingInput) {

    // Validate that guestUserId exists in the users table if provided
    // Waiting for the guestUserId validation to be implemented in the userRepository.ts file. Once that is done, we can uncomment the following code to validate the guestUserId.

    

    // Validate hotel and room existence against array of hotels and rooms in the database

    const hotelCheck = await findHotels({ hotelId: booking.hotelId });
    if (!hotelCheck || hotelCheck.length === 0) {
        throw new AppError("Hotel not found", 404);
    }

    const roomCheck = await findRooms({ roomId: booking.roomId});
    const room = roomCheck[0];
    if (!room || room.hotel_id !== booking.hotelId) {
        throw new AppError("Room not found in the specified hotel", 404);
    }

    const checkInDate = new Date(booking.checkInDate);
    const checkOutDate = new Date(booking.checkOutDate);

    if (checkOutDate <= checkInDate) {
        throw new AppError("checkOutDate must be after checkInDate", 400);
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
        throw new AppError("Number of nights must be greater than 0", 400);
    }

    const roomPrice = room.price;

    const totalPrice = nights * roomPrice;
    if (totalPrice <= 0) {
        throw new AppError("Total price must be greater than 0", 400);
    }

    /*
    How to check overlapping bookings: a booking overlaps if:
    - The new booking's check-in date is before or equal to an existing booking's check-out date AND
    - The new booking's check-out date is after or equal to an existing booking's check-in date.
    */

    const overlappingBooking = await pool.query(
        `
        SELECT *
        FROM bookings
        WHERE room_id = $1
          AND check_in_date < $2
          AND check_out_date > $3
        `,
        [booking.roomId, booking.checkOutDate, booking.checkInDate]
    );

    // Examples of non-overlapping bookings:
    // Existing booking: 2024-01-10 to 2024-01-15
    // New booking: 2024-01-09 to 2024-01-10 (Well, this is not overlapping because the new booking ends on the same day the existing booking starts, which is allowed. Because of that, change the condition to check_in_date < $2 and check_out_date > $3)
    // roomRepo might need to be updated to reflect this change in logic. We should now include this in the backlog of the roomRepository.ts file. The logic for checking overlapping bookings should be updated to reflect this change in the bookingService.ts file as well.

    if (overlappingBooking.rows.length > 0) {
        throw new AppError("Room is already booked for the selected dates", 400);
    }

    return await RepositoryCreateBooking({
        hotelId: booking.hotelId,
        roomId: booking.roomId,
        guestName: booking.guestName,
        guestUserId: booking.guestUserId,
        createdByUserId: booking.createdByUserId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        nights: nights,
        totalPrice: totalPrice
    });
}


/*

PATCH /bookings/:bookingId:
- Validate the bookingId parameter to ensure it's a valid number. If not, return 400 Bad Request.
- Validate the request body to ensure at least one field is provided for update and that they are of the correct type. If not, return 400 Bad Request.
- Check if the specified booking exists. If not, return 404 Not Found.
- If all validations (overlapping, date, nights, total price) pass, update the booking and return the updated booking.

Further notes:
-Nights should not be filled in by the user, but should be calculated based on the check-in and check-out dates.
-Total price should not be filled in by the user, but should be calculated based on the room price and the number of nights.
-Nights > 0, and total price > 0. If not, return 400 Bad Request.
-Checkout date must be after check-in date. If not, return 400 Bad Request.

*/

export async function updateBooking(bookingId: number, updates: {
    hotelId?: number;
    roomId?: number;
    guestName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    nights?: number;
    totalPrice?: number;
}) {

    const bookingCheck = await findBookings({ bookingId });
    if (!bookingCheck || bookingCheck.length === 0) {
        throw new AppError("Booking not found", 404);
    }

    const effectiveHotelId = updates.hotelId ?? bookingCheck[0].hotel_id;
    const effectiveRoomId = updates.roomId ?? bookingCheck[0].room_id;

    const hotelCheck = await findHotels({ hotelId: effectiveHotelId });
    if (!hotelCheck || hotelCheck.length === 0) {
        throw new AppError("Hotel not found", 404);
    }

    const roomCheck = await findRooms({ roomId: effectiveRoomId });
    const room = roomCheck[0];
    if (!room || room.hotel_id !== effectiveHotelId) {
        throw new AppError("Room not found in the specified hotel", 404);
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

    const effectiveTotalPrice = effectiveNights * room.price;
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
    `, [effectiveRoomId, effectiveCheckOutDate, effectiveCheckInDate, bookingId]);

    if (overlappingBooking.rows.length > 0) {
        throw new AppError("Room is already booked for the selected dates", 400);
    }
    
    updates.nights = effectiveNights;
    updates.totalPrice = effectiveTotalPrice;

    return await RepositoryUpdateBooking(bookingId, updates);
}


/*

DELETE /bookings/:bookingId:
- Validate the bookingId parameter to ensure it's a valid number. If not, return 400 Bad Request.
- Check if the specified booking exists. If not, return 404 Not Found.
- If the booking exists, delete it and return a success message with a 200 OK status.


Further notes:
-Nights should not be filled in by the user, but should be calculated based on the check-in and check-out dates.
-Total price should not be filled in by the user, but should be calculated based on the room price and the number of nights.
-Nights > 0, and total price > 0. If not, return 400 Bad Request.
-Checkout date must be after check-in date. If not, return 400 Bad Request.

*/

export async function deleteBooking(bookingId: number) {
    const bookingCheck = await findBookings({ bookingId });
    if (!bookingCheck || bookingCheck.length === 0) {
        throw new AppError("Booking not found", 404);
    }

    return await RepositoryDeleteBooking(bookingId);
}



