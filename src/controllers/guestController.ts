import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { createGuest as serviceCreateGuest } from "../services/guestService";
import { toUserDto } from "../DTO/userDto";

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

