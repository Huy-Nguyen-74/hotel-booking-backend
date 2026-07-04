import express from "express";
import {
  getHotel,
  listRooms,
  listHotels,
  listHotelsByCity,
  listRoomsByHotel,
} from "../controllers/hotelController";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hotel Booking Backend Running! CD Test!");
});

router.get("/hotels", listHotels);
router.get("/rooms", listRooms);
router.get("/hotels/:id/rooms", listRoomsByHotel);
router.get("/hotels/city/:city", listHotelsByCity);
router.get("/hotels/:id", getHotel);

export default router;
 