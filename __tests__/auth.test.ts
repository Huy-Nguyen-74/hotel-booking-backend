import { afterAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import pool from "../src/database/db";


/*
This test suite is for the authentication routes of the application.
    -Tests invalid login attempts (wrong email, wrong password, missing email, missing password).
    -Test successful login and JWT token generation.
*/

describe("POST /login", () => {
  it("returns 400 when email and password are missing", async () => {
    const response = await request(app).post("/login").send({
    });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email and password are required",
    });
  });

  it("returns 400 when email is missing", async () => {
    const response = await request(app).post("/login").send({
      password: "somepassword",
    });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email and password are required",
    });
  });

  it("returns 400 when password is missing", async () => {
    const response = await request(app).post("/login").send({
      email: "user@example.com",
    });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "email and password are required",
    });
  });

  it("returns 401 when email is correct but password is wrong", async () => {
    const response = await request(app).post("/login").send({
      email: "admin@hotel.local",
      password: "wrongpassword",
    });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });
  });

  it("returns 401 when email is wrong but password is correct", async () => {
    const response = await request(app).post("/login").send({
      email: "wrong@example.com",
      password: "Admin123!",
    });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });
  });

  it("returns 401 when email and password are incorrect", async () => {
    const response = await request(app).post("/login").send({
      email: "wrong@example.com",
      password: "wrongpassword",
    });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });
  });

  it("returns 200 and a token when email and password are correct", async () => {
    const response = await request(app).post("/login").send({
      email: "admin@hotel.local",
      password: "Admin123!",
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
        message: "Login successful",
        user: expect.objectContaining({
          email: "admin@hotel.local",
        }),
        token: expect.any(String),
    });
  });
});

afterAll(async () => {
  await pool.end();
});







