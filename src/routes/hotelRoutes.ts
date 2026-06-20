import express from "express";
import pool from "../database/db";
import { AppError } from "../errors/AppError";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hotel Booking Backend Running! CD Test!");
});

router.get("/hotels", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM hotels"
  );

  res.json(result.rows);
});

router.get("/rooms", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM rooms"
  );

  res.json(result.rows);
});

router.get("/hotels/:id/rooms", async (req, res) => {
  const hotelId = Number(req.params.id);

  const result = await pool.query(
    "SELECT * FROM rooms WHERE hotel_id = $1",
    [hotelId]
  );

  res.json(result.rows);
});

router.get("/hotels/city/:city", async (req, res) => {
  const city = req.params.city;

  const result = await pool.query(
    "SELECT * FROM hotels WHERE LOWER(city) = LOWER($1)",
    [city]
  );

  res.json(result.rows);
});

router.get("/hotels/:id", async (req, res) => {
  const hotelId = Number(req.params.id);

  const result = await pool.query(
    "SELECT * FROM hotels WHERE id = $1",
    [hotelId]
  );

  const hotel = result.rows[0];

  if (!hotel) {
    return res.status(404).json({
      message: "Hotel not found"
    });
  }

  res.json(hotel);
});

export default router;
 