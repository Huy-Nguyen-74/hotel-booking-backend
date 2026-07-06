import express from "express";
import pool from "../database/db";
import { AppError } from "../errors/AppError";
import { validateCreateBooking } from "../middleware/validation";

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

const router = express.Router();

interface NewBookingRequest {
  hotelId: number;
  roomId: number;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
}

interface UpdateBookingRequest {
  guestName?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

router.get("/bookings", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM bookings"
  );

  res.json(result.rows);
});

router.get("/bookings/:id", async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);

    const result = await pool.query(
      "SELECT * FROM bookings WHERE id = $1",
      [bookingId]
    );

    const booking = result.rows[0];

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
});

router.post("/bookings", validateCreateBooking, async (req, res, next) => {  try {
    const newBooking = req.body as NewBookingRequest;

    const hotelCheck = await pool.query(
      "SELECT * FROM hotels WHERE id = $1",
      [newBooking.hotelId]
    );

    const hotel = hotelCheck.rows[0];

    if (!hotel) {
      throw new AppError("Hotel not found", 404);
    }

    const foundRoom = await pool.query(
      "SELECT * FROM rooms WHERE id = $1 AND hotel_id = $2",
      [newBooking.roomId, newBooking.hotelId]
    );

    const room = foundRoom.rows[0];

    if (!room) {
      throw new AppError("Room not found in the specified hotel", 404);
    }


    const price = room.price;

    const checkInDate = new Date(newBooking.checkInDate);
    const checkOutDate = new Date(newBooking.checkOutDate);

    const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / MILLISECONDS_PER_DAY
    );

    if (nights <= 0) {
      throw new AppError("checkOutDate must be after checkInDate", 400);
    }
    
    const overlappingBookingResult = await pool.query(
      `
      SELECT *
      FROM bookings
      WHERE room_id = $1
        AND check_in_date < $2
        AND check_out_date > $3
      `,
      [
        Number(newBooking.roomId),
        newBooking.checkOutDate,
        newBooking.checkInDate
      ]
    );

    const overlappingBooking = overlappingBookingResult.rows[0];

    if (overlappingBooking) {
      throw new AppError("Room is already booked for the selected dates", 400);
    }

    const finalBooking = {
      hotelId: Number(newBooking.hotelId),
      roomId: Number(newBooking.roomId),
      guestName: newBooking.guestName,
      checkInDate: newBooking.checkInDate,
      checkOutDate: newBooking.checkOutDate,
      nights: nights,
      totalPrice: price * nights
    };

    const result = await pool.query(
      `
      INSERT INTO bookings (
        hotel_id,
        room_id,
        guest_name,
        check_in_date,
        check_out_date,
        nights,
        total_price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        finalBooking.hotelId,
        finalBooking.roomId,
        finalBooking.guestName,
        finalBooking.checkInDate,
        finalBooking.checkOutDate,
        finalBooking.nights,
        finalBooking.totalPrice
      ]
    );

    res.status(201).json({
      message: "Booking created successfully",
      booking: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});





router.delete("/bookings/:id", async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);

    const result = await pool.query(
      `
      DELETE FROM bookings
      WHERE id = $1
      RETURNING *
      `,
      [bookingId]
    );

    const deletedBooking = result.rows[0];

    if (!deletedBooking) {
      throw new AppError("Booking not found", 404);
    }

    res.json({
      message: "Booking deleted successfully",
      booking: deletedBooking
    });
  } catch (error) {
    next(error);
  }
});





router.patch("/bookings/:id", async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);

    const {
      guestName,
      checkInDate,
      checkOutDate,
    } = req.body as UpdateBookingRequest;

    const existingBookingResult = await pool.query(
      "SELECT * FROM bookings WHERE id = $1",
      [bookingId]
    );

    const existingBooking = existingBookingResult.rows[0];

    if (!existingBooking) {
      throw new AppError("Booking not found", 404);
    }

  
    const finalGuestName = guestName ?? existingBooking.guest_name;
    const finalCheckInDate = checkInDate ?? existingBooking.check_in_date;
    const finalCheckOutDate = checkOutDate ?? existingBooking.check_out_date;

    const finalRoomId = existingBooking.room_id;

    const roomCheck = await pool.query(
      "SELECT * FROM rooms WHERE id = $1",
      [finalRoomId]
    );

    const room = roomCheck.rows[0];

    if (!room) {
      throw new AppError("Room not found", 404);
    }


    const checkIn = new Date(finalCheckInDate);
    const checkOut = new Date(finalCheckOutDate);

    const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / MILLISECONDS_PER_DAY
  );

    if (nights <= 0) {
      throw new AppError("checkOutDate must be after checkInDate", 400);
    }

    const overlappingBookingResult = await pool.query(
      `
      SELECT *
      FROM bookings
      WHERE room_id = $1
        AND id != $2
        AND check_in_date < $3
        AND check_out_date > $4
      `,
      [
        Number(finalRoomId),
        bookingId,
        finalCheckOutDate,
        finalCheckInDate
      ]
    );

    const overlappingBooking = overlappingBookingResult.rows[0];

    if (overlappingBooking) {
      throw new AppError("Room is already booked for the selected dates", 400);
    }

    const totalPrice = room.price * nights;

    const result = await pool.query(
      `
      UPDATE bookings
      SET
        guest_name = $1,
        check_in_date = $2,
        check_out_date = $3,
        nights = $4,
        total_price = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        finalGuestName,
        finalCheckInDate,
        finalCheckOutDate,
        nights,
        totalPrice,
        bookingId,
      ]
    );

    res.json({
      message: "Booking updated successfully",
      booking: result.rows[0]
    });
  } catch (error) {
    next(error);
  } 
});

export default router;

