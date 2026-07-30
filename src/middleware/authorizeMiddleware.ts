import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function authorizeRoles(...allowedRoles: Array<"admin" | "staff" | "guest">) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Access denied", 403));
    }

    next();
  };
}
