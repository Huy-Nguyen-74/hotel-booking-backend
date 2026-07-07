import { Request, Response, NextFunction } from "express";
import { authenticateUser } from "../services/authService";

export async function login(req: Request, res: Response, next: NextFunction) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: "Request body must be a valid JSON object" });
  }

  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "email and password are required" });
  }

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
