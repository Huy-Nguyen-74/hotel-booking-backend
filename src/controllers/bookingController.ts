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
    try {
        const filters = {
            hotelId: req.query.hotelId ? Number(req.query.hotelId) : undefined,
            roomId: req.query.roomId ? Number(req.query.roomId) : undefined,
            guestName: req.query.guestName as string | undefined,
            checkInDate: req.query.checkInDate as string | undefined,
            checkOutDate: req.query.checkOutDate as string | undefined
        };

        if ((filters.hotelId !== undefined && Number.isNaN(filters.hotelId))){
            return next(new AppError("hotelId must be a number", 400));
        }

        if ((filters.roomId !== undefined && Number.isNaN(filters.roomId))){
            return next(new AppError("roomId must be a number", 400));
        }

        if ((filters.guestName !== undefined && typeof filters.guestName !== "string")){
            return next(new AppError("guestName must be a string", 400));
        }

        if ((filters.checkInDate !== undefined && typeof filters.checkInDate !== "string")){
            return next(new AppError("checkInDate must be a string", 400));
        }

        if ((filters.checkOutDate !== undefined && typeof filters.checkOutDate !== "string")){
            return next(new AppError("checkOutDate must be a string", 400));
        }

        const bookings = await serviceGetBookings(filters);
            return res.json(bookings);
    } catch (error) {
        next(error);
    }
}

export async function getBookingById(req: Request, res: Response, next: NextFunction) {
    if (!req.params || typeof req.params !== "object" || Array.isArray(req.params)) {
        return next(new AppError("Request params must be a valid JSON object", 400));
    }

    const bookingId = Number(req.params.bookingId);

    if (Number.isNaN(bookingId)) {
        return next(new AppError("bookingId must be a number", 400));
    }

    try {
        const booking = await serviceGetBookingById(bookingId);
        if (!booking) {
            throw new AppError("Booking not found", 404);
        }

        return res.status(200).json(booking);
    } catch (error) {
        next(error);
    }
}

export async function createBooking(req: Request, res: Response, next: NextFunction) {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return next(new AppError("Request body must be a valid JSON object", 400));
    }

    const { hotelId, roomId, guestName, checkInDate, checkOutDate} = req.body;

    if (
        hotelId === undefined ||
        roomId === undefined ||
        guestName === undefined ||
        checkInDate === undefined ||
        checkOutDate === undefined
    ) {
        return next(new AppError("Missing required fields", 400));
    }

    if (typeof hotelId !== "number" || Number.isNaN(hotelId)) {
        return next(new AppError("hotelId must be a number", 400));
    }

    if (typeof roomId !== "number" || Number.isNaN(roomId)) {
        return next(new AppError("roomId must be a number", 400));
    }

    if (typeof guestName !== "string" || guestName.trim() === "") {
        return next(new AppError("guestName is required and must be a non-empty string", 400));
    }

    if (typeof checkInDate !== "string" || isNaN(Date.parse(checkInDate))) {
        return next(new AppError("checkInDate must be a valid date string", 400));
    }

    if (typeof checkOutDate !== "string" || isNaN(Date.parse(checkOutDate))) {
        return next(new AppError("checkOutDate must be a valid date string", 400));
    }

    try {
        const createdBooking = await serviceCreateBooking({ hotelId, roomId, guestName, checkInDate, checkOutDate });
        return res.status(201).json({ message: "Booking created successfully", booking: createdBooking });
    } catch (error) {
        next(error);
    }
}

export async function updateBooking(req: Request, res: Response, next: NextFunction) {
    if (!req.params || typeof req.params !== "object" || Array.isArray(req.params)) {
        return next(new AppError("Request params must be a valid JSON object", 400));
    }
    
    const bookingId = Number(req.params.bookingId);

    if (Number.isNaN(bookingId)) {
        return next(new AppError("bookingId must be a number", 400));
    }



    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return next(new AppError("Request body must be a valid JSON object", 400));
    }


    // At least one of the fields must be provided for update

    const hotelId = req.body.hotelId !== undefined ? Number(req.body.hotelId) : undefined;
    const roomId = req.body.roomId !== undefined ? Number(req.body.roomId) : undefined;
    const guestName = req.body.guestName !== undefined ? String(req.body.guestName).trim() : undefined;
    const checkInDate = req.body.checkInDate !== undefined ? String(req.body.checkInDate) : undefined;
    const checkOutDate = req.body.checkOutDate !== undefined ? String(req.body.checkOutDate) : undefined;

    if (hotelId === undefined && 
        roomId === undefined && 
        guestName === undefined && 
        checkInDate === undefined && 
        checkOutDate === undefined) {

        return next(new AppError("At least one field must be provided for update", 400));
    }

    if (hotelId !== undefined && (Number.isNaN(hotelId))) {
        return next(new AppError("hotelId must be a number", 400));
    }

    if (roomId !== undefined && (Number.isNaN(roomId))) {
        return next(new AppError("roomId must be a number", 400));
    }

    if (guestName !== undefined && (typeof guestName !== "string" || guestName.trim() === "")) {
        return next(new AppError("guestName must be a non-empty string", 400));
    }

    if (checkInDate !== undefined && (typeof checkInDate !== "string" || isNaN(Date.parse(checkInDate)))) {
        return next(new AppError("checkInDate must be a valid date string", 400));
    }

    if (checkOutDate !== undefined && (typeof checkOutDate !== "string" || isNaN(Date.parse(checkOutDate)))) {
        return next(new AppError("checkOutDate must be a valid date string", 400));
    }

    try {
        const updatedBooking = await serviceUpdateBooking(bookingId, { hotelId, roomId, guestName, checkInDate, checkOutDate });
        return res.status(200).json({ message: "Booking updated successfully", booking: updatedBooking });
    } catch (error) {
        next(error);
    }
}

export async function deleteBooking(req: Request, res: Response, next: NextFunction) {
    if (!req.params || typeof req.params !== "object" || Array.isArray(req.params)) {
        return next(new AppError("Request params must be a valid JSON object", 400));
    }

    const bookingId = Number(req.params.bookingId);

    if (Number.isNaN(bookingId)) {
        return next(new AppError("bookingId must be a number", 400));
    }

    try {
        const deletedBooking = await serviceDeleteBooking(bookingId);
        return res.status(200).json({ message: "Booking deleted successfully", booking: deletedBooking });
    } catch (error) {
        next(error);
    }
}






