import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import {
  createUser as serviceCreateUser,
  deactivateUserById as serviceDeactivateUserById,
  getSelfInfo as serviceGetSelfInfo,
  getUsers as serviceGetUsers,
  updateSelfInfo as serviceUpdateSelfInfo,
  updateUserInfo as serviceUpdateUserInfo,
} from "../services/userService";
import { toUserDto } from "../DTO/userDto";

export async function createUser(req: Request, res: Response, next: NextFunction) {
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
    const user = await serviceCreateUser(inputData);
    return res.status(201).json(toUserDto(user));
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  
  const id = req.query.id;
  const email = req.query.email;

  // Validate query parameters
  if (id !== undefined && (typeof id !== "string" || id.trim() === "")) {
    return next(new AppError("id must be a non-empty string", 400));
  }

  if (email !== undefined && (typeof email !== "string" || email.trim() === "")) {
    return next(new AppError("email must be a non-empty string", 400));
  }

  // Validate id format
  if (id !== undefined && (Number.isNaN(Number(id)) || !Number.isInteger(Number(id)) || Number(id) <= 0)) {
    return next(new AppError("id must be a positive integer", 400));
  }
  
  
  const filters: { id?: number; email?: string } = {};
  if (id !== undefined) {
    filters.id = Number(id);
  }
  if (email !== undefined) {
    filters.email = email.trim().toLowerCase();
  }

  // Validate email format (done only after trimming and converting to lowercase)
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(filters.email!)) {
    return next(new AppError("email must be a valid email address", 400));
  }
  
  try {
    const users = await serviceGetUsers(filters);
    return res.status(200).json(users.map(toUserDto));
  } catch (error) {
    next(error);
  }
}

export async function getSelfInfo(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const user = await serviceGetSelfInfo(req.user.id);
    return res.status(200).json(toUserDto(user));
  } catch (error) {
    next(error);
  }
}

export async function deactivateUserById(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id;

  if (id === undefined || typeof id !== "string" || id.trim() === "") {
    return next(new AppError("user id path parameter is required and must be a non-empty string", 400));
  }

  const parsedId = Number(id.trim());

  if (Number.isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
    return next(new AppError("user id path parameter must be a positive integer", 400));
  }

  try {
    const deactivatedUser = await serviceDeactivateUserById(parsedId);
    return res.status(200).json({success: true, message: "User deactivated successfully", body: toUserDto(deactivatedUser)});
  } catch (error) {
    next(error);
  }
}

export async function updateSelfInfo(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401));
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const password = req.body.password;

   if (firstName === undefined && lastName === undefined && password === undefined) {
    return next(new AppError("At least one field (firstName, lastName, password) must be provided", 400));
  }

  if (firstName !== undefined && (typeof firstName !== "string" || firstName.trim() === "")) {
    return next(new AppError("firstName cannot be an empty string", 400));
  }

  if (lastName !== undefined && (typeof lastName !== "string" || lastName.trim() === "")) {
    return next(new AppError("lastName cannot be an empty string", 400));
  }

  if (password !== undefined && (typeof password !== "string" || password.trim() === "")) {
    return next(new AppError("password cannot be an empty string", 400));
  }

  const parsedFirstName = firstName !== undefined ? firstName.trim() : undefined;
  const parsedLastName = lastName !== undefined ? lastName.trim() : undefined;
 
  try {
    const updatedUser = await serviceUpdateSelfInfo(req.user.id, parsedFirstName, parsedLastName, password);
    if (!updatedUser) {
      return next(new AppError("User not found", 404));
    }
    return res.status(200).json({ success: true, message: "User information updated successfully", body: toUserDto(updatedUser) });
  } catch (error) {
    next(error);
  }
}

export async function updateUserInfo(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id;

  if (id === undefined || typeof id !== "string" || id.trim() === "") {
    return next(new AppError("userId path parameter is required and must be a non-empty string", 400));
  }

  const parsedId = Number(id.trim());

  if (Number.isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
    return next(new AppError("userId path parameter must be a positive integer", 400));
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const isActive = req.body.isActive;

  if (firstName === undefined && lastName === undefined && isActive === undefined) {
    return next(new AppError("At least one field (firstName, lastName, isActive status) must be provided", 400));
  }

  if (firstName !== undefined && (typeof firstName !== "string" || firstName.trim() === "")) {
    return next(new AppError("firstName cannot be an empty string", 400));
  }

  if (lastName !== undefined && (typeof lastName !== "string" || lastName.trim() === "")) {
    return next(new AppError("lastName cannot be an empty string", 400));
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return next(new AppError("isActive must be a boolean value", 400));
  }

  try {
    const updatedUser = await serviceUpdateUserInfo(parsedId, firstName, lastName, isActive);
    return res.status(200).json(toUserDto(updatedUser));
  } catch (error) {
    next(error);
  }
}
