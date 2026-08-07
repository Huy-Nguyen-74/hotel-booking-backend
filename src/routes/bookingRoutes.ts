import { Router } from "express";

import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingController";

import { authenticateToken } from "../middleware/authenticateMiddleware";
import { authorizeRoles } from "../middleware/authorizeMiddleware";

const router = Router();

router.get("/bookings", authenticateToken, authorizeRoles("admin", "staff"), getBookings);
router.get("/bookings/:bookingId", authenticateToken, authorizeRoles("admin", "staff"), getBookingById);
router.post("/bookings", authenticateToken, authorizeRoles("admin", "staff"), createBooking);
router.patch("/bookings/:bookingId", authenticateToken, authorizeRoles("admin", "staff"), updateBooking);
router.delete("/bookings/:bookingId", authenticateToken, authorizeRoles("admin"), deleteBooking);

export default router;

