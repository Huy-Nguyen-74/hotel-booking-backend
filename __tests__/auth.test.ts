import { afterAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import pool from "../src/database/db";


/*
Authentication Tests

[HTTP METHOD] [PATH]: router.post("/login", login);


Access:
- Who can access? Admin, Guest, User, Public, etc.
- Unauthenticated → 401
- Unauthorized role/ownership → 403

Success:
- Valid request → 200
- Expected response -> Success message, user info, JWT token.
- Expected database effect -> nothing, just authentication.

Rejections: reveal the least to maintain security and privacy.
- Missing required fields → 400.
- Invalid input → 400 / 401.
- Broken business rule → 403.
- Missing resource → none, just authentication.
- Conflict → none, just authentication.

Response:
- Required fields -> email, password.
- Fields that must be excluded -> password_hash, passwordHash.

Cleanup:
- Test data to remove/reset -> none, just authentication.
- Database tables affected -> none, just authentication.
*/

const createdUserIDs: number[] = [];

afterEach(async () => {
  // Cleanup: Delete the user records created during testing
  for (const userId of createdUserIDs) {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  }

  createdUserIDs.length = 0; // Clear the array after cleanup
});

describe("POST /login", () => {
  it("returns 400 when email and password are missing", async () => {
    const response = await request(app).post("/login").send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email and password are required",
    });
  });

  it("returns 400 when request body is not a valid JSON object", async () => {
    const response = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send("This is not a JSON object");
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Request body must be a valid JSON object",
    });
  });

  it("returns 400 when email is not a valid email address", async () => {
    const response = await request(app)
      .post("/login")
      .send({
        email: "invalid-email",
        password: "somepassword",
      });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email must be a valid email address",
    });
  });

  it("returns 400 when email is an empty string", async () => {
    const response = await request(app)
      .post("/login")
      .send({
        email: "",
        password: "somepassword",
      });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email and password are required",
    });
  });

  it("returns 400 when password is an empty string", async () => {
    const response = await request(app)
      .post("/login")
      .send({
        email: "john@example.com",
        password: "",
      });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email and password are required",
    });
  });

  it("returns 401 when email or password is incorrect", async () => {
    const response = await request(app)
      .post("/login")
      .send({
        email: "nonexistent@example.com",
        password: "somepassword",
      });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });
  });

  // Inactive user test case
  it("returns 403 when user is inactive", async () => {
    // First, create a guest with a specific email and deactivate them
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "Inactive",
        lastName: "User",
        email: "inactive@example.com",
        password: "password123456789",
      });
    expect(createResponse.status).toBe(201); // Ensure the user was created successfully

    // Deactivate the user
    const userId = (await pool.query("SELECT id FROM users WHERE email = $1", ["inactive@example.com"])).rows[0].id;
    createdUserIDs.push(userId); // Add the created user ID to the cleanup list
    await pool.query("UPDATE users SET is_active = false WHERE id = $1", [userId]);

    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "inactive@example.com",
        password: "password123456789",
      });
    expect(loginResponse.status).toBe(403);
    expect(loginResponse.body).toEqual({
      success: false,
      message: "User is inactive",
    });
  });

  // Successful login test case
  it("returns 200 and a JWT token when guest's email and password are correct", async () => {
    // First, create a guest with a specific email and password
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123456789",
      });
    expect(createResponse.status).toBe(201); // Ensure the user was created successfully

    const userId = (await pool.query("SELECT id FROM users WHERE email = $1", ["john@example.com"])).rows[0].id;
    createdUserIDs.push(userId); // Add the created user ID to the cleanup list

    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "john@example.com",
        password: "password123456789",
      });
    
    /* Make sure the response contains:
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    */
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");
    expect(loginResponse.body.user).toHaveProperty("userId", userId);
    expect(loginResponse.body.user).toHaveProperty("email", "john@example.com");
    expect(loginResponse.body.user).toHaveProperty("firstName", "John");
    expect(loginResponse.body.user).toHaveProperty("lastName", "Doe");
    expect(loginResponse.body.user).toHaveProperty("role", "guest");
    expect(loginResponse.body.user).not.toHaveProperty("password");
    expect(loginResponse.body.user).not.toHaveProperty("passwordHash");
    expect(loginResponse.body.user).not.toHaveProperty("password_hash");
  });

  it("returns 200 and a JWT token when admin's email and password are correct", async () => {
    // POST /users only ever creates staff users, so the seeded admin account is used here instead.
    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "admin@hotel.local",
        password: "Admin123!",
      });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");
    expect(loginResponse.body.user).toHaveProperty("userId");
    expect(loginResponse.body.user).toHaveProperty("email", "admin@hotel.local");
    expect(loginResponse.body.user).toHaveProperty("role", "admin");
    expect(loginResponse.body.user).not.toHaveProperty("password");
    expect(loginResponse.body.user).not.toHaveProperty("passwordHash");
    expect(loginResponse.body.user).not.toHaveProperty("password_hash");
  });
});

afterAll(async () => {
  await pool.end();
});







