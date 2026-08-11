import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { toUserDto } from "../DTO/userDto";
import { toBookingDto } from "../DTO/bookingDto";
import type { CreateBookingInput } from "../types/booking";

import { 
  createGuest as serviceCreateGuest,
  guestCreateBooking as serviceGuestCreateBooking,
 } from "../services/guestService";

 import {
  guestViewAllBookingHistory as serviceGuestViewAllBookingHistory,
  guestViewOneSpecificBooking as serviceGuestViewOneSpecificBooking,
  guestUpdateTheirOwnBooking as serviceGuestUpdateTheirOwnBooking,
  cancelOwnBooking as serviceCancelOwnBooking
 } from "../services/guestService";

export async function createGuest(req: Request, res: Response, next: NextFunction) {
  if (!req.body || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;

  // Validate required fields

  if (firstName === undefined || lastName === undefined || email === undefined || password === undefined) {
    return next(new AppError("All fields are required", 400));
  }

  // Validate that fields are not empty strings
  
  if (typeof firstName !== "string" || typeof lastName !== "string" || typeof email !== "string" || typeof password !== "string") {
    return next(new AppError("All fields must be strings", 400));
  }

  if (firstName.trim() === "" || lastName.trim() === "" || email.trim() === "" || password.trim() === "") {
    return next(new AppError("All fields must be non-empty strings", 400));
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    return next(new AppError("Password is required and must be a non-empty string", 400));
  }

  if (password.length < 15) {
    return next(new AppError("Password must be at least 15 characters long", 400));
  }

  const parsedFirstName = firstName.trim();
  const parsedLastName = lastName.trim();
  const parsedEmail = email.trim().toLowerCase();

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsedEmail)) {
    return next(new AppError("Email must be a valid email address", 400));
  }

  const inputData = {
    firstName: parsedFirstName,
    lastName: parsedLastName,
    email: parsedEmail,
    password,
    role: "guest",
  };

  try {
    const user = await serviceCreateGuest(inputData);
    return res.status(201).json(toUserDto(user));
  } catch (error) {
    next(error);
  }
}

// For guest viewing their own profile, we can reuse the getSelfInfo function from userController.ts.

export async function guestCreateBooking(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id || typeof req.user.id !== "number") {
    return next(new AppError("User must be authenticated", 401));
  }
  
  if (!req.body || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  // Reuse the validation logic from createBooking in bookingController.ts

  const rawHotelId = req.body.hotelId;
  const rawRoomId = req.body.roomId;
  const rawGuestName = req.body.guestName;
  const rawGuestUserId = req.user.id;
  const rawCreatedByUserId = req.user.id;
  const rawCheckInDate = req.body.checkInDate;
  const rawCheckOutDate = req.body.checkOutDate;

  // Validate required fields

  if (rawHotelId === undefined || rawRoomId === undefined || rawGuestName === undefined || rawCheckInDate === undefined || rawCheckOutDate === undefined) {
    return next(new AppError("hotelId, roomId, guestName, checkInDate, and checkOutDate are required", 400));
  }

  // Validate that fields are of the correct type, one by one

  if (typeof rawHotelId !== "number" || isNaN(rawHotelId) || !Number.isInteger(rawHotelId) || rawHotelId <= 0) {
    return next(new AppError("hotelId must be a positive integer", 400));
  }

  if (typeof rawRoomId !== "number" || isNaN(rawRoomId) || !Number.isInteger(rawRoomId) || rawRoomId <= 0) {
    return next(new AppError("roomId must be a positive integer", 400));
  }
  
  if (typeof rawGuestName !== "string" || rawGuestName.trim() === "") {
    return next(new AppError("guestName must be a non-empty string", 400));
  }

  if (typeof rawCheckInDate !== "string" || rawCheckInDate.trim() === "" || isNaN(Date.parse(rawCheckInDate))) {
    return next(new AppError("checkInDate must be a valid date string", 400));
  }

  if (typeof rawCheckOutDate !== "string" || rawCheckOutDate.trim() === "" || isNaN(Date.parse(rawCheckOutDate))) {
    return next(new AppError("checkOutDate must be a valid date string", 400));
  }

  // Parse and trim the input values

  const bookingData: CreateBookingInput = {
    hotelId: rawHotelId,
    roomId: rawRoomId,
    guestName: rawGuestName.trim(),
    guestUserId: rawGuestUserId,
    createdByUserId: rawCreatedByUserId,
    checkInDate: rawCheckInDate.trim(),
    checkOutDate: rawCheckOutDate.trim(),
  };

  try {
    const createdBooking = await serviceGuestCreateBooking(bookingData);
    return res.status(201).json(toBookingDto(createdBooking));
  } catch (error) {
    next(error);
  }
}

export async function guestViewAllBookingHistory(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id || typeof req.user.id !== "number") {
    return next(new AppError("User must be authenticated", 401));
  }

  const guestUserId = req.user.id;

  try {
    const bookingHistory = await serviceGuestViewAllBookingHistory(guestUserId);
    return res.status(200).json(bookingHistory.map(toBookingDto));
  } catch (error) {
    next(error);
  }
}

export async function guestViewOneSpecificBooking(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id || typeof req.user.id !== "number") {
    return next(new AppError("User must be authenticated", 401));
  }

  const guestUserId = req.user.id;
  const bookingIdParam = req.params.bookingId;

  if (!bookingIdParam || isNaN(Number(bookingIdParam)) || Number(bookingIdParam) <= 0 || !Number.isInteger(Number(bookingIdParam))) {
    return next(new AppError("Booking ID must be a positive integer", 400));
  }

  try {
    const bookingId = Number(bookingIdParam);
    const booking = await serviceGuestViewOneSpecificBooking(guestUserId, bookingId);
    return res.status(200).json(toBookingDto(booking));
  } catch (error) {
    next(error);
  }
}

export async function guestUpdateTheirOwnBooking(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id || typeof req.user.id !== "number") {
    return next(new AppError("User must be authenticated", 401));
  }
  
  const guestUserId = req.user.id;
  const bookingIdParam = req.params.bookingId;

  if (!bookingIdParam || isNaN(Number(bookingIdParam)) || Number(bookingIdParam) <= 0 || !Number.isInteger(Number(bookingIdParam))) {
    return next(new AppError("Booking ID must be a positive integer", 400));
  }

  if (!req.body || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  const rawGuestName = req.body.guestName;
  const rawCheckInDate = req.body.checkInDate;
  const rawCheckOutDate = req.body.checkOutDate;

  if (rawGuestName === undefined && rawCheckInDate === undefined && rawCheckOutDate === undefined) {
    return next(new AppError("At least one of guestName, checkInDate, or checkOutDate must be provided", 400));
  }

  if (rawGuestName !== undefined && (typeof rawGuestName !== "string" || rawGuestName.trim() === "")) {
    return next(new AppError("guestName must be a non-empty string", 400));
  }

  if (rawCheckInDate !== undefined && (typeof rawCheckInDate !== "string" || rawCheckInDate.trim() === "" || isNaN(Date.parse(rawCheckInDate)))) {
    return next(new AppError("checkInDate must be a valid date string", 400));
  }

  if (rawCheckOutDate !== undefined && (typeof rawCheckOutDate !== "string" || rawCheckOutDate.trim() === "" || isNaN(Date.parse(rawCheckOutDate)))) {
    return next(new AppError("checkOutDate must be a valid date string", 400));
  }

  const updates: { guestName?: string; checkInDate?: string; checkOutDate?: string } = {};
  if (rawGuestName !== undefined) {
    updates.guestName = rawGuestName.trim();
  }
  if (rawCheckInDate !== undefined) {
    updates.checkInDate = rawCheckInDate.trim();
  }
  if (rawCheckOutDate !== undefined) {
    updates.checkOutDate = rawCheckOutDate.trim();
  }

  try {
    const bookingId = Number(bookingIdParam);
    const updatedBooking = await serviceGuestUpdateTheirOwnBooking(guestUserId, bookingId, updates);
    return res.status(200).json(toBookingDto(updatedBooking));
  } catch (error) {
    next(error);
  }
}

export async function cancelOwnBooking(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id || typeof req.user.id !== "number") {
    return next(new AppError("User must be authenticated", 401));
  }

  const guestUserId = req.user.id;
  const bookingIdParam = req.params.bookingId;

  if (!bookingIdParam || isNaN(Number(bookingIdParam)) || Number(bookingIdParam) <= 0 || !Number.isInteger(Number(bookingIdParam))) {
    return next(new AppError("Booking ID must be a positive integer", 400));
  }

  try {
    const bookingId = Number(bookingIdParam);
    const cancelledBooking = await serviceCancelOwnBooking(bookingId, guestUserId);
    return res.status(200).json({ message: "Booking cancelled successfully", booking: toBookingDto(cancelledBooking) });
  } catch (error) {
    next(error);
  }
}