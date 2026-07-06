import { Router } from "express";

import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingController";

const router = Router();

router.get("/bookings", getBookings);
router.get("/bookings/:bookingId", getBookingById);
router.post("/bookings", createBooking);
router.patch("/bookings/:bookingId", updateBooking);
router.delete("/bookings/:bookingId", deleteBooking);

export default router;

