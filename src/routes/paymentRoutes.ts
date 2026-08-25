import { Router } from "express";
import { createPaymentForGuest } from "../controllers/paymentController";
import { authenticateToken } from "../middleware/authenticateMiddleware";
import { authorizeRoles } from "../middleware/authorizeMiddleware";

const router = Router();

router.post("/guests/bookings/:bookingId/payments", authenticateToken, authorizeRoles("guest"), createPaymentForGuest);

export default router;
