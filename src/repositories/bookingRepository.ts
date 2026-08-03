/*
July 6th, 2026: refactoring booking

GET /bookings using query parameters:
- Optional query parameters: hotelId, roomId, guestName, checkInDate, checkOutDate.
- If no query parameters are provided, return all bookings.
- Validate that the provided query parameters are of the correct type. If not, return 400 Bad Request.
- If valid query parameters are provided but no bookings match, return an empty array.

POST /bookings:
- Validate the request body to ensure all required fields are present and of the correct type. If not, return 400 Bad Request.
- Check if the specified hotel and room exist. If not, return 404 Not Found.
- Check if the room is available for the specified date range. If not, return 409 Conflict.
- If all validations pass, create the booking and return the created booking with a 201 Created status.

PATCH /bookings/:bookingId:
- Validate the bookingId parameter to ensure it's a valid number. If not, return 400 Bad Request.
- Validate the request body to ensure at least one field is provided for update and that they are of the correct type. If not, return 400 Bad Request.
- Check if the specified booking exists. If not, return 404 Not Found.
- If all validations pass, update the booking and return the updated booking.

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

import pool from "../database/db";

export async function findBookings(filters: { 
    bookingId?: number;
    hotelId?: number; 
    roomId?: number; 
    guestName?: string; 
    checkInDate?: string; 
    checkOutDate?: string }) {
    
    const values: Array<string | number> = [];
    const conditions: string[] = [];

    if (filters.bookingId !== undefined) {
        conditions.push(`id = $${values.length + 1}`);
        values.push(filters.bookingId);
    }

    if (filters.hotelId !== undefined) {
        conditions.push(`hotel_id = $${values.length + 1}`);
        values.push(filters.hotelId);
    }

    if (filters.roomId !== undefined) {
        conditions.push(`room_id = $${values.length + 1}`);
        values.push(filters.roomId);
    }

    if (filters.guestName !== undefined) {
        conditions.push(`guest_name ILIKE $${values.length + 1}`);
        values.push(`%${filters.guestName}%`);
    }

    if (filters.checkInDate !== undefined) {
        conditions.push(`check_in_date = $${values.length + 1}`);
        values.push(filters.checkInDate);
    }

    if (filters.checkOutDate !== undefined) {
        conditions.push(`check_out_date = $${values.length + 1}`);
        values.push(filters.checkOutDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM bookings ${whereClause}`;
    const result = await pool.query(query, values);
    return result.rows;
}

export async function guestViewAllBookingHistory(guestUserId: number) {
    const result = await pool.query(
        `
        SELECT * FROM bookings
        WHERE guest_user_id = $1
        ORDER BY check_in_date DESC
        `,
        [guestUserId]
    );
    return result.rows;
}

export async function guestViewOneSpecificBooking(guestUserId: number, bookingId: number) {
    const result = await pool.query(
        `
        SELECT * FROM bookings
        WHERE guest_user_id = $1 AND id = $2
        `,
        [guestUserId, bookingId]
    );
    return result.rows[0];
}

export async function createBooking(booking: { 
    hotelId: number; 
    roomId: number; 
    guestName: string; 
    guestUserId?: number;
    createdByUserId: number;
    checkInDate: string; 
    checkOutDate: string; 
    nights: number; 
    totalPrice: number }) {

    const result = await pool.query(
        `
        INSERT INTO bookings (hotel_id, room_id, guest_name, guest_user_id, created_by_user_id, check_in_date, check_out_date, nights, total_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [booking.hotelId, booking.roomId, booking.guestName, booking.guestUserId, booking.createdByUserId, booking.checkInDate, booking.checkOutDate, booking.nights, booking.totalPrice]
    );
    return result.rows[0];
}



export async function updateBooking(bookingId: number, updates: { 
    hotelId?: number;
    roomId?: number;
    guestName?: string;
    checkInDate?: string;  
    checkOutDate?: string; 
    nights?: number; 
    totalPrice?: number }) {

    const result = await pool.query(
        `
        UPDATE bookings
        SET hotel_id = COALESCE($2, hotel_id), 
            room_id = COALESCE($3, room_id),
            guest_name = COALESCE($4, guest_name),
            check_in_date = COALESCE($5, check_in_date),
            check_out_date = COALESCE($6, check_out_date),
            nights = COALESCE($7, nights),
            total_price = COALESCE($8, total_price)
        WHERE id = $1
        RETURNING *
        `,
        [bookingId, updates.hotelId, updates.roomId, updates.guestName, updates.checkInDate, updates.checkOutDate, updates.nights, updates.totalPrice]
    );
    return result.rows[0];
}

export async function deleteBooking(bookingId: number) {
    const result = await pool.query(
        `
        DELETE FROM bookings
        WHERE id = $1
        RETURNING *
        `,
        [bookingId]
    );
    return result.rows[0];
}



