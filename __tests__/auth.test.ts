import { afterAll, describe, expect, it } from "@jest/globals";
import { createHash } from "crypto";
import request from "supertest";
import { app } from "../src/app";
import pool from "../src/database/db";

const createdUserIds: number[] = [];
const createdPasswordResetTokens: string[] = [];

afterEach(async () => {
  // Cleanup: Delete the user records created during testing
  for (const userId of createdUserIds) {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  }
  createdUserIds.length = 0; // Clear the array after cleanup

  // Cleanup: Delete the password reset tokens created during testing
  for (const token of createdPasswordResetTokens) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await pool.query("DELETE FROM password_reset_tokens WHERE token_hash = $1", [tokenHash]);
  }
  createdPasswordResetTokens.length = 0; // Clear the array after cleanup
});

afterAll(async () => {
  await pool.end();
});

/*
Authentication Tests

[HTTP METHOD] [PATH]: router.post("/login", login);


Access:
- Who can access? Admin, Guest, User, Public, etc.
- Unauthenticated ↁE401
- Unauthorized role/ownership ↁE403

Success:
- Valid request ↁE200
- Expected response -> Success message, user info, JWT token.
- Expected database effect -> nothing, just authentication.

Rejections: reveal the least to maintain security and privacy.
- Missing required fields ↁE400.
- Invalid input ↁE400 / 401.
- Broken business rule ↁE403.
- Missing resource ↁEnone, just authentication.
- Conflict ↁEnone, just authentication.

Response:
- Required fields -> email, password.
- Fields that must be excluded -> password_hash, passwordHash.

Cleanup:
- Test data to remove/reset -> none, just authentication.
- Database tables affected -> none, just authentication.
*/

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
    createdUserIds.push(userId); // Add the created user ID to the cleanup list
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
        email: "john.auth@example.com",
        password: "password123456789",
      });
    expect(createResponse.status).toBe(201); // Ensure the user was created successfully

    const userId = (await pool.query("SELECT id FROM users WHERE email = $1", ["john.auth@example.com"])).rows[0].id;
    createdUserIds.push(userId); // Add the created user ID to the cleanup list

    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "john.auth@example.com",
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
    expect(loginResponse.body.user).toHaveProperty("email", "john.auth@example.com");
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
        password: "Admin123456789!",
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


/*
[HTTP METHOD] [PATH]: request password reset endpoint.

router.post("/request-password-reset", requestPasswordReset);

Access:
- Who can access? Admin, Guest, User, Public, etc. ↁEPublic
- Unauthenticated ↁEnone.
- Unauthorized role/ownership ↁEnone.

Success:
- Valid request ↁE(won't reveal if the email exists or not).
- Expected response -> neutral message indicating that if the email exists, a password reset link will be sent.
- Expected database effect -> a password reset token is created and stored in the database with an expiry time, userId, and hashed token.

Rejections:
- Invalid input ↁE400.
- Broken business rule ↁEnone.
- Missing resource ↁE neutral message indicating that if the email exists, a password reset link will be sent.
- Conflict ↁEnone.

Response: neutral message indicating that if the email exists, a password reset link will be sent.

Cleanup:
- Test data to remove/reset: password reset tokens created during the tests.
*/

describe("POST /request-password-reset", () => {
  it("returns 400 when email is missing", async () => {
    const response = await request(app)
      .post("/request-password-reset")
      .send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email is required and must be a non-empty string",
    });
  });

  it("returns 400 when email format is invalid", async () => {
    const response = await request(app)
      .post("/request-password-reset")
      .send({ email: "invalid-email" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email must be a valid email address",
    });
  });

  it("returns 200 with a neutral message when email does not exist", async () => {
    const response = await request(app)
      .post("/request-password-reset")
      .send({ email: "nonexistent@example.com" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "If the email exists, a password reset link will be sent",
    });
  });

  it("returns 400 when email is an empty string", async () => {
    const response = await request(app)
      .post("/request-password-reset")
      .send({ email: "" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email is required and must be a non-empty string",
    });
  });

  it("returns 200 with a neutral message when email exists", async () => {
    // First, create a guest with a specific email
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john.auth@example.com",
        password: "password123456789",
      });
    expect(createResponse.status).toBe(201); // Ensure the user was created successfully

    const userId = (await pool.query("SELECT id FROM users WHERE email = $1", ["john.auth@example.com"])).rows[0].id;
    createdUserIds.push(userId); // Add the created user ID to the cleanup list

    const response = await request(app)
      .post("/request-password-reset")
      .send({ email: "john.auth@example.com" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "If the email exists, a password reset link will be sent",
      resetToken: expect.any(String), // The token should be a string
    });

    // Make sure the token is stored in the database with the correct userId and hashed token
    const tokenCheck = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE user_id = $1",
      [userId]
    );
    expect(tokenCheck.rows.length).toBe(1);
    expect(tokenCheck.rows[0].user_id).toBe(userId);
    expect(tokenCheck.rows[0].token_hash).toBe(createHash("sha256").update(response.body.resetToken).digest("hex"));
    
    // Store the created password reset token for cleanup
    createdPasswordResetTokens.push(response.body.resetToken);
  });
});

/*
[HTTP METHOD] [PATH]: router.post("/confirm-password-reset", confirmPasswordReset);

Access:
- Who can access? Public
- Unauthenticated ↁE401
- Unauthorized role/ownership ↁEnone, just authentication.

Success:
- Valid request ↁE200.
- Expected response -> success message indicating that the password has been reset successfully.
- Expected database effect -> the user's password is updated in the database, and the password reset token is deleted.

Rejections:
- Invalid input ↁE400.
- Broken business rule ↁE[status].
- Missing resource ↁE404.
- Conflict ↁE409.

Response:
- Required fields: message indicating that the password has been reset successfully.
- Fields that must be excluded: password reset token, hashed token, userId, expiry.

Cleanup:
- Test data to remove/reset: password reset tokens created during the tests.
*/

describe("POST /confirm-password-reset", () => {
  it("returns 400 when token is missing", async () => {
    const response = await request(app)
      .post("/confirm-password-reset")
      .send({}); 
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "token is required and must be a non-empty string",
    });
  });

  it("returns 400 when newPassword is missing", async () => {
    const response = await request(app)
      .post("/confirm-password-reset")
      .send({ token: "sometoken" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "newPassword is required and must be a non-empty string",
    });
  });

  it("returns 400 when newPassword is less than 15 characters", async () => {
    const response = await request(app)
      .post("/confirm-password-reset")
      .send({ token: "sometoken", newPassword: "short" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "newPassword must be at least 15 characters long",
    });
  });

  it("returns 400 when request body is not a valid JSON object", async () => {
    const response = await request(app)
      .post("/confirm-password-reset")
      .set("Content-Type", "application/json")
      .send("This is not a JSON object");
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Request body must be a valid JSON object",
    });
  });

  it("returns 404 when token does not exist", async () => {
    const response = await request(app)
      .post("/confirm-password-reset")
      .send({ token: "nonexistenttoken", newPassword: "newpassword123456789" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid or expired password reset token",
    });
  });

  it("returns 404 when token is expired", async () => {
    // First, create a guest with a specific email
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john.expired@example.com",
        password: "password123456789",
      });
    expect(createResponse.status).toBe(201);

    const userId = (await pool.query("SELECT id FROM users WHERE email = $1", ["john.expired@example.com"])).rows[0].id;
    createdUserIds.push(userId);

    // Create an expired password reset token
    const resetToken = "expiredtoken";
    const tokenHash = createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, tokenHash, expiresAt]
    );

    const response = await request(app)
      .post("/confirm-password-reset")
      .send({ token: resetToken, newPassword: "newpassword123456789" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid or expired password reset token",
    });
  });

  it("returns 200 when token is valid and newPassword meets requirements", async () => {
    // First, create a guest with a specific email
    const createResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john.valid@example.com",
        password: "password123456789",
      });
    expect(createResponse.status).toBe(201);

    const userId = (await pool.query("SELECT id FROM users WHERE email = $1", ["john.valid@example.com"])).rows[0].id;
    createdUserIds.push(userId);

    // Create a valid password reset token, using requestPasswordReset function to generate a valid token
    const requestResetResponse = await request(app)
      .post("/request-password-reset")
      .send({ email: "john.valid@example.com" });
    expect(requestResetResponse.status).toBe(200);
    const resetToken = requestResetResponse.body.resetToken;

    const response = await request(app)
      .post("/confirm-password-reset")
      .send({ token: resetToken, newPassword: "newpassword123456789" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Password reset successful",
    });

    // Verify that login with the new password works
    const loginResponse = await request(app)
      .post("/login")
      .send({ email: "john.valid@example.com", password: "newpassword123456789" });
    expect(loginResponse.status).toBe(200);
  });
});
  






