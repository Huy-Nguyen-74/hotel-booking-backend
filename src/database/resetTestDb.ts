import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { Pool } from "pg";

const testDbConfig = {
  user: "postgres",
  host: "localhost",
  database: "hotel_booking_test",
  password: "4733",
  port: 5432,
};

const projectRoot = path.join(__dirname, "../../");

const testDatabaseUrl = `postgres://${testDbConfig.user}:${encodeURIComponent(
  testDbConfig.password
)}@${testDbConfig.host}:${testDbConfig.port}/${testDbConfig.database}`;

async function resetTestDb() {
  const seedPath = path.join(projectRoot, "seed.sql");
  const seedSql = fs.readFileSync(seedPath, "utf-8");

  const resetPool = new Pool(testDbConfig);

  // Start from a clean schema so migrations rebuild the DB from history.
  await resetPool.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
  await resetPool.end();

  // Apply all migrations to reconstruct the baseline structure.
  execSync("npx node-pg-migrate -m migrations up", {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
    },
  });

  const seedPool = new Pool(testDbConfig);
  await seedPool.query(seedSql);
  await seedPool.end();

  console.log("Test database reset successfully");
}

resetTestDb().catch((error) => {
  console.error("Failed to reset test database:", error);
  process.exit(1);
});