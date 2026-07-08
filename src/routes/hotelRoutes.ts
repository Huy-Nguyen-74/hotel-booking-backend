import express from "express";
import {
  getHotels,
  createHotel as controllerCreateHotel,
  updateHotel as controllerUpdateHotel,
} from "../controllers/hotelController";

import { authenticateToken } from "../middleware/authenticateMiddleware";
import { authorizeRoles } from "../middleware/authorizeMiddleware";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hotel Booking Backend Running! CD Test!");
});

router.get("/hotels", authenticateToken, authorizeRoles("admin", "staff"), getHotels);
router.post("/hotels", authenticateToken, authorizeRoles("admin"), controllerCreateHotel);
router.patch("/hotels/:hotelId", authenticateToken, authorizeRoles("admin"), controllerUpdateHotel);

export default router;
