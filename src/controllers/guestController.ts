import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { createGuest as serviceCreateGuest } from "../services/guestService";
import { toUserDto } from "../DTO/userDto";
import { searchAvailableRooms as serviceSearchAvailableRooms } from "../services/guestService";

export async function createGuest(req: Request, res: Response, next: NextFunction) {
  if (!req.body || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  const role = req.body.role;

  // Validate required fields

  if (firstName === undefined || lastName === undefined || email === undefined || password === undefined || role === undefined) {
    return next(new AppError("All fields are required", 400));
  }

  // Validate that fields are not empty strings

  if (typeof firstName !== "string" || typeof lastName !== "string" || typeof email !== "string" || typeof password !== "string" || typeof role !== "string") {
    return next(new AppError("All fields must be strings", 400));
  }

  if (firstName.trim() === "" || lastName.trim() === "" || email.trim() === "" || password.trim() === "" || role.trim() === "") {
    return next(new AppError("All fields must be non-empty strings", 400));
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    return next(new AppError("password is required and must be a non-empty string", 400));
  }

  if (password.length < 15) {
    return next(new AppError("password must be at least 15 characters long", 400));
  }

  const parsedFirstName = firstName.trim();
  const parsedLastName = lastName.trim();
  const parsedEmail = email.trim().toLowerCase();
  const parsedRole = role.trim().toLowerCase();

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsedEmail)) {
    return next(new AppError("email must be a valid email address", 400));
  }

  const inputData = {
    firstName: parsedFirstName,
    lastName: parsedLastName,
    email: parsedEmail,
    password,
    role: parsedRole,
  };

  try {
    const user = await serviceCreateGuest(inputData);
    return res.status(201).json(toUserDto(user));
  } catch (error) {
    next(error);
  }
}

// Guest viewing their own information is handled by the getSelfInfo function in userController.ts, which retrieves the user's information based on their ID.

// Guest updating their own information is handled by the updateSelfInfo function in userController.ts, which allows the guest to update their own information based on their ID.

export async function searchAvailableRooms(req: Request, res: Response, next: NextFunction) {

  if (req.query && Array.isArray(req.query)) {
    return next(new AppError("Query parameters must be a valid object", 400));
  }
  
  const hotelId = req.query.hotelId;
  const type = req.query.type;
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const checkInDate = req.query.checkInDate;
  const checkOutDate = req.query.checkOutDate;

  // Validate format and non-empty strings for query parameters

  if (hotelId !== undefined && (typeof hotelId !== "string" || hotelId.trim() === "")) {
    throw new AppError("hotelId must be a non-empty string", 400);
  }

  if (type !== undefined && (typeof type !== "string" || type.trim() === "")) {
    throw new AppError("type must be a non-empty string", 400);
  }

  if (minPrice !== undefined && (typeof minPrice !== "string" || minPrice.trim() === "")) {
    throw new AppError("minPrice must be a non-empty string", 400);
  }

  if (maxPrice !== undefined && (typeof maxPrice !== "string" || maxPrice.trim() === "")) {
    throw new AppError("maxPrice must be a non-empty string", 400);
  }

  if (checkInDate !== undefined && (typeof checkInDate !== "string" || checkInDate.trim() === "")) {
    throw new AppError("checkInDate must be a non-empty string", 400);
  }

  if (checkOutDate !== undefined && (typeof checkOutDate !== "string" || checkOutDate.trim() === "")) {
    throw new AppError("checkOutDate must be a non-empty string", 400);
  }

  // Parse query parameters to appropriate types
  const parsedHotelId = hotelId !== undefined ? Number(hotelId) : undefined;
  const parsedType = type !== undefined ? type.trim() : undefined;
  const parsedMinPrice = minPrice !== undefined ? Number(minPrice) : undefined;
  const parsedMaxPrice = maxPrice !== undefined ? Number(maxPrice) : undefined;
  const parsedCheckInDate = checkInDate !== undefined ? checkInDate.trim() : undefined;
  const parsedCheckOutDate = checkOutDate !== undefined ? checkOutDate.trim() : undefined;

  // Validate that hotelId, minPrice, and maxPrice are valid numbers if provided

  if (parsedHotelId !== undefined && (Number.isNaN(parsedHotelId) || !Number.isInteger(parsedHotelId) || parsedHotelId <= 0)) {
    throw new AppError("hotelId must be a positive integer", 400);
  }
  if (parsedMinPrice !== undefined && (Number.isNaN(parsedMinPrice) || parsedMinPrice < 0)) {
    throw new AppError("minPrice must be a non-negative number", 400);
  }
  if (parsedMaxPrice !== undefined && (Number.isNaN(parsedMaxPrice) || parsedMaxPrice < 0)) {
    throw new AppError("maxPrice must be a non-negative number", 400);
  }

  if (parsedCheckInDate !== undefined && isNaN(Date.parse(parsedCheckInDate))) {
    throw new AppError("checkInDate must be a valid date string", 400);
  }

  if (parsedCheckOutDate !== undefined && isNaN(Date.parse(parsedCheckOutDate))) {
    throw new AppError("checkOutDate must be a valid date string", 400);
  }

  const filters = {
    hotelId: parsedHotelId,
    type: parsedType,
    minPrice: parsedMinPrice,
    maxPrice: parsedMaxPrice,
    checkInDate: parsedCheckInDate,
    checkOutDate: parsedCheckOutDate,
  };

  try {
    const availableRooms = await serviceSearchAvailableRooms(filters);
    return res.json(availableRooms);
  } catch (error) {
    next(error);
  }
}

export async function guestCreateBooking(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id || typeof req.user.id !== "number") {
    return next(new AppError("User must be authenticated", 401));
  }
  
  if (!req.body || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  // Reuse the validation logic from createBooking in bookingController.ts

  


  