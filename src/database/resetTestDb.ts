import "dotenv/config"; // Loads variables from .env into process.env
import fs from "fs"; // Filesystem module, used to read seed.sql
import path from "path"; // Path module, used to build absolute file paths
import { execSync } from "child_process"; // Runs shell commands synchronously (used to invoke migrations)
import { Pool } from "pg"; // PostgreSQL connection pool client

const projectRoot = path.join(__dirname, "../../"); // Resolves the project's root directory relative to this file

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required");
}

async function resetTestDb() { // Main function that wipes and rebuilds the test database
  const seedPath = path.join(projectRoot, "seed.sql"); // Path to the SQL file containing fixture/test data
  const seedSql = fs.readFileSync(seedPath, "utf-8"); // Reads the seed file contents as a string

  const resetPool = new Pool({ connectionString: testDatabaseUrl }); // Opens a connection pool to the test database for schema reset

  await resetPool.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"); // Wipes all tables/objects and recreates an empty schema
  await resetPool.end(); // Closes this pool since the schema reset is done

  execSync("npx node-pg-migrate -m migrations up", { // Runs all migration files to rebuild the schema from history
    cwd: projectRoot, // Runs the command from the project root so relative paths resolve correctly
    stdio: "inherit", // Pipes the child process output directly to this terminal
    env: { // Overrides environment variables for the migration command
      ...process.env, // Keeps all existing environment variables
      DATABASE_URL: testDatabaseUrl, // Points node-pg-migrate at the test database instead of dev/prod
    },
  });

  const seedPool = new Pool({ connectionString: testDatabaseUrl }); // Opens a new connection pool for inserting seed data
  await seedPool.query(seedSql); // Executes seed.sql to populate fixture data
  await seedPool.end(); // Closes the seed connection pool

  console.log("Test database reset successfully"); // Logs confirmation once reset completes
}

resetTestDb().catch((error) => { // Invokes the reset function and handles any failure
  console.error("Failed to reset test database:", error); // Logs the error details
  process.exit(1); // Exits with a failure code so CI/test runs fail loudly
});