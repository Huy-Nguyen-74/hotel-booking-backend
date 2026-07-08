import { Router } from "express";
import { login } from "../controllers/authController";
import { authenticateToken } from "../middleware/authenticateMiddleware";

const router = Router();

router.post("/login", authenticateToken, login);

export default router;


