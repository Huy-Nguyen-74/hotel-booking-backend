import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { AuthUser } from "../types/auth";

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError("Authentication token missing", 401));
  }

  if (!authHeader.startsWith("Bearer ")) {
    return next(new AppError("Invalid authentication token format", 401));
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next(new AppError("Authentication token missing", 401));
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next(new AppError("JWT_SECRET is not configured", 500));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError("Invalid authentication token", 403));
  }
}
