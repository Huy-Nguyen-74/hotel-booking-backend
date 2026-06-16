import fs from "fs";
import path from "path";
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "hotel_booking_test",
  password: "4733",
  port: 5432,
});

async function resetTestDb() {
  const schemaPath = path.join(__dirname, "../../schema.sql");
  const seedPath = path.join(__dirname, "../../seed.sql");

  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  const seedSql = fs.readFileSync(seedPath, "utf-8");

  await pool.query(schemaSql);
  await pool.query(seedSql);

  await pool.end();

  console.log("Test database reset successfully");
}

resetTestDb().catch((error) => {
  console.error("Failed to reset test database:", error);
  process.exit(1);
});