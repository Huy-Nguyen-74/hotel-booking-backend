import express from "express";
import {
  getHotels,
  createHotel as controllerCreateHotel,
  updateHotel as controllerUpdateHotel,
} from "../controllers/hotelController";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hotel Booking Backend Running! CD Test!");
});

router.get("/hotels", getHotels);
router.post("/hotels", controllerCreateHotel);
router.patch("/hotels/:hotelId", controllerUpdateHotel);

export default router;
