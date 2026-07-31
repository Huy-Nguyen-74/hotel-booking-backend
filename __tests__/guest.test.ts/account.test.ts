import { afterAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app";
import pool from "../../src/database/db";


/*
Guest Registration Tests

POST /guests: router.post("/guests", createGuest);

Access:
- Public endpoint; authentication is not required.

Success:
- Valid firstName, lastName, email, and password → 201.
- Creates an active user with role automatically set to "guest".
- Stores a hashed password, not the original password.

Rejections:
- Missing, malformed, or invalid fields → 400.
- Existing email → 409.

Response:
- Returns the success message and created guest fields.
- role must be "guest" and isActive must be true.
- Excludes password, passwordHash, and password_hash.

Cleanup:
- Delete the guest record created during testing.
*/

const createdGuestIDs: number[] = [];

afterEach(async () => {
  // Cleanup: Delete the guest records created during testing
  for (const guestId of createdGuestIDs) {
    await pool.query("DELETE FROM users WHERE id = $1", [guestId]);
  }

  createdGuestIDs.length = 0; // Clear the array after cleanup
});

afterAll(async () => {
  // Close the database connection after all tests are done
  await pool.end();
});

describe("POST /guests", () => {
  it("returns 400 when required fields are missing", async () => {
    const response = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        // email is missing
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it.each([
    "invalid-email", // no @
    "@example.com", // no local part
    "john@example", // no TLD
    "john @example.com", // contains space
  ])("returns 400 when email is malformed (%s)", async (email) => {
    const response = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email,
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("returns 400 when password is too short", async () => {
    const response = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Password must be at least 15 characters long");
  });

  it("returns 409 when email already exists", async () => {
    // First, create a guest with a specific email
    const initialResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123456789",
      });

    expect(initialResponse.status).toBe(201);
    const createdGuestId = initialResponse.body.userId;
    createdGuestIDs.push(createdGuestId);

    // Attempt to create another guest with the same email
    const response = await request(app)
      .post("/guests")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123456789",
      });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty("message", "Email already exists");
  });

  it("returns 201 and creates a guest when all fields are valid", async () => {
    const response = await request(app)
      .post("/guests")
      .send({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
        password: "password123456789",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("userId");
    expect(response.body).toHaveProperty("firstName");
    expect(response.body).toHaveProperty("lastName");
    expect(response.body).toHaveProperty("email");
    expect(response.body).toHaveProperty("role", "guest");
    expect(response.body).toHaveProperty("isActive", true);
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
    expect(response.body).not.toHaveProperty("password_hash");

    const createdGuestId = response.body.userId;
    createdGuestIDs.push(createdGuestId);
  });
});



