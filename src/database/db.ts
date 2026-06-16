import { Pool } from "pg"; // Import PostgreSQL connection manager

const pool = new Pool({
  user: "postgres", // PostgreSQL username
  host: "localhost", // Database is running on this PC
  database:
  process.env.NODE_ENV === "test"
    ? "hotel_booking_test"
    : "hotel_booking",
  password: "4733", // Your PostgreSQL password
  port: 5432, // PostgreSQL default port
});

export default pool; // Allow other files to use this connection
export { pool };

