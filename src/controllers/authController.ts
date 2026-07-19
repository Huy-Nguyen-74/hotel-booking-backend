import { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../services/authService";
import { AppError } from "../errors/AppError";

export async function login(req: Request, res: Response, next: NextFunction) {
  if (!req.body || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  const parsedEmail = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const parsedPassword = typeof req.body.password === "string" ? req.body.password : "";

  if (!parsedEmail || !parsedPassword) {
    return next(new AppError("email and password are required", 400));
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsedEmail)) {
    return next(new AppError("email must be a valid email address", 400));
  }

  const email = parsedEmail;
  const password = parsedPassword;
  
  try {
    const authResult = await authenticateUser(email, password);

    return res.status(200).json({
      message: "Login successful",
      user: authResult.user,
      token: authResult.token,
    });
  } catch (error) {
    next(error);
  }
}
