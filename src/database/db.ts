import { Pool, types } from "pg"; // Import PostgreSQL connection manager

// Return DATE columns as raw "YYYY-MM-DD" strings instead of Date objects,
// which pg otherwise parses at local midnight and JSON.stringify shifts to UTC.
types.setTypeParser(1082, (value: string) => value);

const databaseUrl = process.env.DATABASE_URL;

const pool = databaseUrl
  ? new Pool({
      connectionString: process.env.NODE_ENV === "test"
        ? process.env.TEST_DATABASE_URL ?? databaseUrl.replace(/\/hotel_booking(?:\?.*)?$/, "/hotel_booking_test")
        : databaseUrl,
    })
  : new Pool({
      user: "postgres", // Fallback local development config
      host: "localhost",
      database: process.env.NODE_ENV === "test" ? "hotel_booking_test" : "hotel_booking",
      password: "4733",
      port: 5432,
    });

export default pool; // Allow other files to use this connection
export { pool };

