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



/*
Guest views their own profile

[GET] /guests/me

Access:
- Who can access? -> guests with valid JWT token.
- Unauthenticated → 401.
- Unauthorized role/ownership → 403.

Success:
- Valid request → 200.
- Returns the guest's own profile information.
- Excludes sensitive fields like password, passwordHash, and password_hash.
- Expected database effect -> none.

Rejections:
- Invalid input → 400.
- Broken business rule → 403.
- Missing resource → none, just authentication.
- Conflict → none, just authentication.

Response:
- Required fields -> firstName, lastName, email, role, isActive, createdAt, updatedAt.
- Fields that must be excluded -> password, passwordHash, password_hash.

Cleanup:
- Test data to remove/reset -> none, just authentication.
- Database tables affected -> none, just authentication.
*/


describe("GET /guests/me", () => {
  it("returns 401 when no token is provided", async () => {
    const response = await request(app).get("/guests/me");
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("returns 403 when an invalid token is provided", async () => {
    const response = await request(app)
      .get("/guests/me")
      .set("Authorization", "Bearer invalidtoken");
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });

  it("returns 200 and the guest's profile when a valid token is provided", async () => {
    // First, create a guest to obtain a valid token
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123456789",
      });

    expect(createResponse.status).toBe(201);
    const createdGuestId = createResponse.body.userId;
    createdGuestIDs.push(createdGuestId);

    // Login to get a valid token
    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "john@example.com",
        password: "password123456789",
      });

    const token = loginResponse.body.token; // Assuming the response includes a JWT token

    const response = await request(app)
      .get("/guests/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("firstName", "John");
    expect(response.body).toHaveProperty("lastName", "Doe");
    expect(response.body).toHaveProperty("email", "john@example.com");
    expect(response.body).toHaveProperty("role", "guest");
    expect(response.body).toHaveProperty("isActive", true);
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
    expect(response.body).not.toHaveProperty("password_hash");
  });
});


/*

[HTTP METHOD] [PATH]: PATCH /guests/me

Access:
- Who can access? -> guests with valid JWT token.
- Unauthenticated → 401.
- Unauthorized role/ownership → 403.

Success:
- Valid request → 200.
- Updates the guest's own profile information.
- Excludes sensitive fields like password, passwordHash, and password_hash.
- Expected database effect -> the guest's profile is updated in the database.

Rejections:
- Invalid input → 400 (firstName, lastName, password, etc.).
- Broken business rule → [status].
- Missing resource → 404.
- Conflict → none, just authentication.

Response:
- Required fields -> firstName, lastName, email, role, isActive, createdAt, updatedAt.
- Fields that must be excluded -> password, passwordHash, password_hash.

Cleanup:
- Test data to remove/reset.
*/

describe("PATCH /guests/me", () => {
  it("returns 401 when no token is provided", async () => {
    const response = await request(app).patch("/guests/me").send({
      firstName: "UpdatedFirstName",
    });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Authentication token missing");
  });

  it("returns 403 when an invalid token is provided", async () => {
    const response = await request(app)
      .patch("/guests/me")
      .set("Authorization", "Bearer invalidtoken")
      .send({
        firstName: "UpdatedFirstName",
      });
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Invalid authentication token");
  });

  it("returns 400 when no fields are provided", async () => {
    // First, create a guest to obtain a valid token
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123456789",
      });

    expect(createResponse.status).toBe(201);
    const createdGuestId = createResponse.body.userId;
    createdGuestIDs.push(createdGuestId);

    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "john@example.com",
        password: "password123456789",
      });

    const token = loginResponse.body.token; // Assuming the response includes a JWT token

    const response = await request(app)
      .patch("/guests/me")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "At least one field (firstName, lastName, password) must be provided");
  });

  it("returns 400 when the provided fields are empty strings", async () => {
    // First, create a guest to obtain a valid token
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123456789",
      });

    expect(createResponse.status).toBe(201);
    const createdGuestId = createResponse.body.userId;
    createdGuestIDs.push(createdGuestId);

    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "john@example.com",
        password: "password123456789",
      });

    const token = loginResponse.body.token; // Assuming the response includes a JWT token

    const response = await request(app)
      .patch("/guests/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "firstName cannot be an empty string");
  });

  it("returns 200 and updates the guest's profile when valid fields are provided", async () => {
    // First, create a guest to obtain a valid token
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123456789",
      });

    expect(createResponse.status).toBe(201);
    const createdGuestId = createResponse.body.userId;
    createdGuestIDs.push(createdGuestId);

    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "john@example.com",
        password: "password123456789",
      });

    const token = loginResponse.body.token; // Assuming the response includes a JWT token

    const response = await request(app)
      .patch("/guests/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        firstName: "UpdatedFirstName",
        lastName: "UpdatedLastName",
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "User information updated successfully");
    expect(response.body.body).toHaveProperty("firstName", "UpdatedFirstName");
    expect(response.body.body).toHaveProperty("lastName", "UpdatedLastName");
  });

  it("returns 200 and updates the guest's password when a valid password is provided", async () => {
    // First, create a guest to obtain a valid token
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123456789",
      });

    expect(createResponse.status).toBe(201);
    const createdGuestId = createResponse.body.userId;
    createdGuestIDs.push(createdGuestId);

    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "john@example.com",
        password: "password123456789",
      });

    const token = loginResponse.body.token; // Assuming the response includes a JWT token

    const response = await request(app)
      .patch("/guests/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        password: "newpassword123456789",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "User information updated successfully");
    expect(response.body.body).toHaveProperty("userId", createdGuestId);

    // Attempt to login with the new password to verify the update
    const newLoginResponse = await request(app)
      .post("/login")
      .send({
        email: "john@example.com",
        password: "newpassword123456789",
      });

    expect(newLoginResponse.status).toBe(200);
    expect(newLoginResponse.body).toHaveProperty("token");
    expect(newLoginResponse.body.token).toBeTruthy();
    expect(newLoginResponse.body.user).toHaveProperty("userId", createdGuestId);
    expect(newLoginResponse.body.user).toHaveProperty("role", "guest");
    expect(newLoginResponse.body.user).toHaveProperty("email", "john@example.com");
    expect(newLoginResponse.body.user).toHaveProperty("firstName", "John");
    expect(newLoginResponse.body.user).toHaveProperty("lastName", "Doe");
    expect(newLoginResponse.body.user).not.toHaveProperty("password");
    expect(newLoginResponse.body.user).not.toHaveProperty("passwordHash");
    expect(newLoginResponse.body.user).not.toHaveProperty("password_hash");
  });
});

