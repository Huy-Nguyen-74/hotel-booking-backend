import { Request, Response, NextFunction } from "express";
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
    return res.status(400).json({ success: false, message: "Request body must be a valid JSON object" });
  }

  const firstName = typeof req.body.firstName === "string" ? req.body.firstName.trim() : "";
  const lastName = typeof req.body.lastName === "string" ? req.body.lastName.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const role = req.body.role;

  if (!firstName || !lastName || !email || !password || (role !== "admin" && role !== "staff")) {
    return res.status(400).json({ success: false, message: "Invalid user payload" });
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
    return res.status(400).json({ success: false, message: "id must be a number" });
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
    return res.status(401).json({ success: false, message: "Unauthorized" });
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
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }

  try {
    const deactivatedUser = await serviceDeactivateUserById(id);
    return res.status(200).json({ message: "User deactivated successfully", body: deactivatedUser });
  } catch (error) {
    next(error);
  }
}

export async function updateSelfInfo(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: "Request body must be a valid JSON object" });
  }

  const firstName = req.body.firstName !== undefined ? String(req.body.firstName).trim() : undefined;
  const lastName = req.body.lastName !== undefined ? String(req.body.lastName).trim() : undefined;
  const password = req.body.password !== undefined ? String(req.body.password) : undefined;

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
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: "Request body must be a valid JSON object" });
  }

  const firstName = req.body.firstName !== undefined ? String(req.body.firstName).trim() : undefined;
  const lastName = req.body.lastName !== undefined ? String(req.body.lastName).trim() : undefined;
  const role = req.body.role;
  const isActive = req.body.isActive;

  if (role !== undefined && role !== "admin" && role !== "staff") {
    return res.status(400).json({ success: false, message: "role must be admin or staff" });
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return res.status(400).json({ success: false, message: "isActive must be a boolean" });
  }

  try {
    const updatedUser = await serviceUpdateUserInfo(id, firstName, lastName, role, isActive);
    return res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
}
