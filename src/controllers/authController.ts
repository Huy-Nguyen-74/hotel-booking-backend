import { Request, Response, NextFunction } from "express";
import { authenticateUser,
  requestPasswordReset as serviceRequestPasswordReset,
  confirmPasswordReset as serviceConfirmPasswordReset
} from "../services/authService";
import { AppError } from "../errors/AppError";
import { toAuthDto } from "../DTO/authDto";

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
      user: toAuthDto(authResult.user),
      token: authResult.token,
    });
  } catch (error) {
    next(error);
  }
}

export async function requestPasswordReset(req: Request, res: Response, next: NextFunction) {
  if (!req.body || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  if (!req.body.email || typeof req.body.email !== "string" || !req.body.email.trim()) {
    return next(new AppError("email is required and must be a non-empty string", 400));
  }

  const email = req.body.email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new AppError("email must be a valid email address", 400));
  }

  try {
    const result = await serviceRequestPasswordReset(email);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function confirmPasswordReset(req: Request, res: Response, next: NextFunction) {
  if (!req.body || Array.isArray(req.body)) {
    return next(new AppError("Request body must be a valid JSON object", 400));
  }

  if (!req.body.token || typeof req.body.token !== "string" || !req.body.token.trim()) {
    return next(new AppError("token is required and must be a non-empty string", 400));
  }

  if (!req.body.newPassword || typeof req.body.newPassword !== "string" || !req.body.newPassword.trim()) {
    return next(new AppError("newPassword is required and must be a non-empty string", 400));
  }

  if (req.body.newPassword.length < 15) {
    return next(new AppError("newPassword must be at least 15 characters long", 400));
  }

  const token = req.body.token.trim();
  const newPassword = req.body.newPassword;

  try {
    await serviceConfirmPasswordReset(token, newPassword);
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
}


    