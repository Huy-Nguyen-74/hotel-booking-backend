import { Router } from "express";
import { login, requestPasswordReset, confirmPasswordReset } from "../controllers/authController";

const router = Router();

router.post("/login", login);
router.post("/request-password-reset", requestPasswordReset);
router.post("/confirm-password-reset", confirmPasswordReset);

export default router;


