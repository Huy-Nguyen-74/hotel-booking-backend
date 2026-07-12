import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const parseError = error as Error & { type?: string; body?: unknown };

  if (parseError.type === "entity.parse.failed" || (error instanceof SyntaxError && parseError.body !== undefined)) {
    return res.status(400).json({
      success: false,
      message: "Request body must be a valid JSON object"
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}