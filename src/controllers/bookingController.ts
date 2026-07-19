import { Request, Response, NextFunction } from "express";

import {
    getBookings as serviceGetBookings,
    getBookingById as serviceGetBookingById,
    createBooking as serviceCreateBooking,
    updateBooking as serviceUpdateBooking,
    deleteBooking as serviceDeleteBooking    
}  from "../services/bookingService"; // Service module path.
import { AppError } from "../errors/AppError";


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

export async function getBookings(req: Request, res: Response, next: NextFunction) {
    if (!req.query || Array.isArray(req.query)) {
        return next(new AppError("Request query must be a valid JSON object", 400));
    }

    const rawHotelId = req.query.hotelId;
    const rawRoomId = req.query.roomId;
    const rawGuestName = req.query.guestName;
    const rawCheckInDate = req.query.checkInDate;
    const rawCheckOutDate = req.query.checkOutDate;

    if (rawHotelId !== undefined && typeof rawHotelId !== "string") {
        return next(new AppError("hotelId must be a string", 400));
    }

    if (rawRoomId !== undefined && typeof rawRoomId !== "string") {
        return next(new AppError("roomId must be a string", 400));
    }

    if (rawGuestName !== undefined && typeof rawGuestName !== "string") {
        return next(new AppError("guestName must be a string", 400));
    }

    if (rawCheckInDate !== undefined && typeof rawCheckInDate !== "string") {
        return next(new AppError("checkInDate must be a string", 400));
    }

    if (rawCheckOutDate !== undefined && typeof rawCheckOutDate !== "string") {
        return next(new AppError("checkOutDate must be a string", 400));
    }

    const parsedHotelId = typeof rawHotelId === "string" && rawHotelId.trim() !== "" ? Number(rawHotelId.trim()) : undefined;
    const parsedRoomId = typeof rawRoomId === "string" && rawRoomId.trim() !== "" ? Number(rawRoomId.trim()) : undefined;
    const parsedGuestName = typeof rawGuestName === "string" && rawGuestName.trim() !== "" ? rawGuestName.trim() : undefined;
    const parsedCheckInDate = typeof rawCheckInDate === "string" && rawCheckInDate.trim() !== "" ? rawCheckInDate.trim() : undefined;
    const parsedCheckOutDate = typeof rawCheckOutDate === "string" && rawCheckOutDate.trim() !== "" ? rawCheckOutDate.trim() : undefined;

    if (parsedHotelId !== undefined && (Number.isNaN(parsedHotelId) || !Number.isInteger(parsedHotelId) || parsedHotelId <= 0)) {
        return next(new AppError("hotelId must be an integer greater than 0", 400));
    }

    if (parsedRoomId !== undefined && (Number.isNaN(parsedRoomId) || !Number.isInteger(parsedRoomId) || parsedRoomId <= 0)) {
        return next(new AppError("roomId must be an integer greater than 0", 400));
    }

    if (parsedCheckInDate !== undefined && Number.isNaN(Date.parse(parsedCheckInDate))) {
        return next(new AppError("checkInDate must be a valid date string", 400));
    }

    if (parsedCheckOutDate !== undefined && Number.isNaN(Date.parse(parsedCheckOutDate))) {
        return next(new AppError("checkOutDate must be a valid date string", 400));
    }

    if (
        parsedCheckInDate !== undefined &&
        parsedCheckOutDate !== undefined &&
        new Date(parsedCheckOutDate) <= new Date(parsedCheckInDate)
    ) {
        return next(new AppError("checkOutDate must be after checkInDate", 400));
    }

    const filters = {
        hotelId: parsedHotelId,
        roomId: parsedRoomId,
        guestName: parsedGuestName,
        checkInDate: parsedCheckInDate,
        checkOutDate: parsedCheckOutDate
    };
    
    try {
        const bookings = await serviceGetBookings(filters);
        return res.json(bookings);
    } catch (error) {
        next(error);
    }
}

export async function getBookingById(req: Request, res: Response, next: NextFunction) {
    if (!req.params || Array.isArray(req.params)) {
        return next(new AppError("Request params must be a valid JSON object", 400));
    }

    const rawBookingId = req.params.bookingId;

    const parsedBookingId = typeof rawBookingId === "string" && rawBookingId.trim() !== "" ? Number(rawBookingId.trim()) : undefined;

    if (parsedBookingId === undefined || Number.isNaN(parsedBookingId) || !Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
        return next(new AppError("bookingId must be an integer greater than 0", 400));
    }

    try {
        const booking = await serviceGetBookingById(parsedBookingId);
        if (!booking) {
            throw new AppError("Booking not found", 404);
        }

        return res.status(200).json(booking);
    } catch (error) {
        next(error);
    }
}

export async function createBooking(req: Request, res: Response, next: NextFunction) {
    if (!req.body || Array.isArray(req.body)) {
        return next(new AppError("Request body must be a valid JSON object", 400));
    }

    const rawHotelId = req.body.hotelId;
    const rawRoomId = req.body.roomId;    
    const rawGuestName = req.body.guestName;
    const rawCheckInDate = req.body.checkInDate;
    const rawCheckOutDate = req.body.checkOutDate;

    if (rawHotelId === undefined || rawRoomId === undefined || rawGuestName === undefined || rawCheckInDate === undefined || rawCheckOutDate === undefined) {
        return next(new AppError("All fields are required", 400));
    }

    if (typeof rawHotelId !== "number") {
        return next(new AppError("hotelId must be a number", 400));
    }

    if (typeof rawRoomId !== "number") {
        return next(new AppError("roomId must be a number", 400));
    }

    if (typeof rawGuestName !== "string" || rawGuestName.trim() === "") {
        return next(new AppError("guestName must be a non-empty string", 400));
    }

    if (typeof rawCheckInDate !== "string" || isNaN(Date.parse(rawCheckInDate))) {
        return next(new AppError("checkInDate must be a valid date string", 400));
    }

    if (typeof rawCheckOutDate !== "string" || isNaN(Date.parse(rawCheckOutDate))) {
        return next(new AppError("checkOutDate must be a valid date string", 400));
    }

    const parsedHotelId = rawHotelId;
    const parsedRoomId = rawRoomId;
    const parsedGuestName = rawGuestName.trim();
    const parsedCheckInDate = rawCheckInDate.trim();
    const parsedCheckOutDate = rawCheckOutDate.trim();

    if (!Number.isInteger(parsedHotelId) || parsedHotelId <= 0) {
        return next(new AppError("hotelId must be an integer greater than 0", 400));
    }

    if (!Number.isInteger(parsedRoomId) || parsedRoomId <= 0) {
        return next(new AppError("roomId must be an integer greater than 0", 400));
    }

    if (new Date(parsedCheckOutDate) <= new Date(parsedCheckInDate)) {
        return next(new AppError("checkOutDate must be after checkInDate", 400));
    }

    try {
        const createdBooking = await serviceCreateBooking({ hotelId: parsedHotelId, roomId: parsedRoomId, guestName: parsedGuestName, checkInDate: parsedCheckInDate, checkOutDate: parsedCheckOutDate });
        return res.status(201).json({ message: "Booking created successfully", booking: createdBooking });
    } catch (error) {
        next(error);
    }
}

export async function updateBooking(req: Request, res: Response, next: NextFunction) {
    if (!req.params || Array.isArray(req.params)) {
        return next(new AppError("Request params must be a valid JSON object", 400));
    }

    if (!req.body || Array.isArray(req.body)) {
        return next(new AppError("Request body must be a valid JSON object", 400));
    }

    const rawBookingId = req.params.bookingId;
    const rawHotelId = req.body.hotelId;
    const rawRoomId = req.body.roomId;
    const rawGuestName = req.body.guestName;
    const rawCheckInDate = req.body.checkInDate;
    const rawCheckOutDate = req.body.checkOutDate;

    // Validate data presence

    if (rawBookingId === undefined) {
        return next(new AppError("bookingId is required", 400));
    }

    if (rawHotelId === undefined && rawRoomId === undefined && rawGuestName === undefined && rawCheckInDate === undefined && rawCheckOutDate === undefined) {
        return next(new AppError("At least one field must be provided for update", 400));
    }

    // Validate data types

    if (typeof rawBookingId !== "string" || rawBookingId.trim() === "") {
        return next(new AppError("bookingId must be a valid number", 400));
    }

    if (rawHotelId !== undefined && typeof rawHotelId !== "number") {
        return next(new AppError("hotelId must be a number", 400));
    }

    if (rawRoomId !== undefined && typeof rawRoomId !== "number") {
        return next(new AppError("roomId must be a number", 400));
    }

    if (rawGuestName !== undefined && (typeof rawGuestName !== "string" || rawGuestName.trim() === "")) {
        return next(new AppError("guestName must be a non-empty string", 400));
    }

    if (rawCheckInDate !== undefined && (typeof rawCheckInDate !== "string" || isNaN(Date.parse(rawCheckInDate)))) {
        return next(new AppError("checkInDate must be a valid date string", 400));
    }

    if (rawCheckOutDate !== undefined && (typeof rawCheckOutDate !== "string" || isNaN(Date.parse(rawCheckOutDate)))) {
        return next(new AppError("checkOutDate must be a valid date string", 400));
    }

    const parsedBookingId = Number(rawBookingId.trim());
    const parsedHotelId = rawHotelId;
    const parsedRoomId = rawRoomId;
    const parsedGuestName = typeof rawGuestName === "string" ? rawGuestName.trim() : undefined;
    const parsedCheckInDate = typeof rawCheckInDate === "string" ? rawCheckInDate.trim() : undefined;
    const parsedCheckOutDate = typeof rawCheckOutDate === "string" ? rawCheckOutDate.trim() : undefined;

    // Validate data values

    if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
        return next(new AppError("bookingId must be an integer greater than 0", 400));
    }

    if (parsedHotelId !== undefined && (!Number.isInteger(parsedHotelId) || parsedHotelId <= 0)) {
        return next(new AppError("hotelId must be an integer greater than 0", 400));
    }

    if (parsedRoomId !== undefined && (!Number.isInteger(parsedRoomId) || parsedRoomId <= 0)) {
        return next(new AppError("roomId must be an integer greater than 0", 400));
    }

    if (parsedCheckInDate !== undefined && parsedCheckOutDate !== undefined && new Date(parsedCheckOutDate) <= new Date(parsedCheckInDate)) {
        return next(new AppError("checkOutDate must be after checkInDate", 400));
    }

    try {
        const updatedBooking = await serviceUpdateBooking(parsedBookingId, { hotelId: parsedHotelId, roomId: parsedRoomId, guestName: parsedGuestName, checkInDate: parsedCheckInDate, checkOutDate: parsedCheckOutDate });
        return res.status(200).json({ message: "Booking updated successfully", booking: updatedBooking });
    } catch (error) {
        next(error);
    }
}

export async function deleteBooking(req: Request, res: Response, next: NextFunction) {
    if (!req.params || Array.isArray(req.params)) {
        return next(new AppError("Request params must be a valid JSON object", 400));
    }

    const rawBookingId = req.params.bookingId;
        
    if (typeof rawBookingId !== "string" || rawBookingId.trim() === "") {
        return next(new AppError("bookingId is required and must be a valid number", 400));
    }

    const parsedBookingId = Number(rawBookingId.trim());

    if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
        return next(new AppError("bookingId must be an integer greater than 0", 400));
    }

    try {
        const deletedBooking = await serviceDeleteBooking(parsedBookingId);
        return res.status(200).json({ message: "Booking deleted successfully", booking: deletedBooking });
    } catch (error) {
        next(error);
    }
}






