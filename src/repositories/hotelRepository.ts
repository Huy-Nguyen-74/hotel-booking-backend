import pool from "../database/db";

export async function findAllHotels() {
  const result = await pool.query("SELECT * FROM hotels");
  return result.rows;
}

export async function findAllRooms() {
  const result = await pool.query("SELECT * FROM rooms");
  return result.rows;
}

export async function findHotelById(id: number) {
  const result = await pool.query(
    "SELECT * FROM hotels WHERE id = $1",
    [id]
  );

  return result.rows[0] || null;
}

export async function findHotelsByCity(city: string) {
  const result = await pool.query(
    "SELECT * FROM hotels WHERE LOWER(city) = LOWER($1)",
    [city]
  );

  return result.rows;
}

export async function findRoomsByHotelId(hotelId: number) {
  const result = await pool.query(
    "SELECT * FROM rooms WHERE hotel_id = $1",
    [hotelId]
  );

  return result.rows;
}