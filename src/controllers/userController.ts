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

export async function createUser(req: Request, res: Response, next: NextFunction) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  const firstName = typeof req.body.firstName === "string" ? req.body.firstName.trim() : "";
  const lastName = typeof req.body.lastName === "string" ? req.body.lastName.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const role = req.body.role;

  if (!firstName || !lastName || !email || !password || !role) {
    return next(new AppError("Invalid user payload", 400));
  }

  try {
    const user = await serviceCreateUser({ firstName, lastName, email, password, role });
    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  const filters = {
    id: req.query.id !== undefined ? Number(req.query.id) : undefined,
    email: req.query.email ? String(req.query.email).toLowerCase() : undefined,
  };

  if (filters.id !== undefined && Number.isNaN(filters.id)) {
    return next(new AppError("id must be a number", 400));
  }

  if (filters.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(filters.email)) {
    return next(new AppError("email must be a valid email address", 400));
  }

  try {
    const users = await serviceGetUsers(filters);
    return res.status(200).json(users);
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
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function deactivateUserById(req: Request, res: Response, next: NextFunction) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return next(new AppError("Invalid user id", 400));
  }

  try {
    const deactivatedUser = await serviceDeactivateUserById(id);
    return res.status(200).json({success: true, message: "User deactivated successfully", body: deactivatedUser });
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

  const firstName = req.body.firstName !== undefined ? String(req.body.firstName).trim() : undefined;
  const lastName = req.body.lastName !== undefined ? String(req.body.lastName).trim() : undefined;
  const password = req.body.password !== undefined ? String(req.body.password) : undefined;

  if (firstName !== undefined && firstName === "") {
    return next(new AppError("firstName cannot be an empty string", 400));
  }

  if (lastName !== undefined && lastName === "") {
    return next(new AppError("lastName cannot be an empty string", 400));
  }

  if (password !== undefined && password === "") {
    return next(new AppError("password cannot be an empty string", 400));
  }

  if (firstName === undefined && lastName === undefined && password === undefined) {
    return next(new AppError("At least one field (firstName, lastName, password) must be provided", 400));
  }

  try {
    const updatedUser = await serviceUpdateSelfInfo(req.user.id, firstName, lastName, password);
    return res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
}

export async function updateUserInfo(req: Request, res: Response, next: NextFunction) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return next(new AppError("Invalid userId. userId must be a valid number", 400));
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  const firstName = req.body.firstName !== undefined ? String(req.body.firstName).trim() : undefined;
  const lastName = req.body.lastName !== undefined ? String(req.body.lastName).trim() : undefined;
  const isActive = req.body.isActive;

  if (firstName === undefined && lastName === undefined && isActive === undefined) {
    return next(new AppError("At least one field (firstName, lastName, isActive status) must be provided", 400));
  }

  if (firstName !== undefined && firstName === "") {
    return next(new AppError("firstName cannot be an empty string", 400));
  }

  if (lastName !== undefined && lastName === "") {
    return next(new AppError("lastName cannot be an empty string", 400));
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return next(new AppError("isActive must be a boolean value", 400));
  }

  try {
    const updatedUser = await serviceUpdateUserInfo(id, firstName, lastName, isActive);
    return res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
}
