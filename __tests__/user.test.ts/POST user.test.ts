/*

In this file, we are testing the POST /users route of the userController. 
The route is protected and requires authentication and authorization.
Only users with the "admin" role can access this route to create new users:

Route: router.post("/users", authenticateToken, authorizeRoles("admin"), createUser);

Route contract:
- Who may access it? Only users with the "admin" role.
- Which method/path? POST /users

Success:
- What valid outcomes must work? The route should create a new user (only staff, must not allow admin creation) and return the created user's information, excluding sensitive fields like password hashes.

Validation:
- Which inputs can be missing, malformed, or invalid? The request body must include firstName, lastName, email, password, and role. Missing or invalid fields should result in a 400 Bad Request response.

Business rules:
- What valid input must still be rejected?
        If the user is not authenticated or does not have the "admin" role, they should receive a 403 Forbidden response.
        If the email is already in use, the route should return a 409 Conflict response.
        
Not found:
- Which referenced resource may not exist? Not applicable for this route.

Response contract:
- Status, body shape, sensitive fields? The response should have a 201 status code and return a JSON object representing the created user without sensitive fields.

Data effects:
- What should be created, changed, or remain unchanged? A new user should be created in the database.

Cleanup:
- What test data must be removed afterward? The created user should be deleted after the test to maintain a clean state.

*/

import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app";
import pool from "../../src/database/db";
import { authHeaders } from "../../src/helpers/authHelper";
import { adminLoginForTest, staffLoginForTest } from "../../src/helpers/loginHelper";

const createdUserIds: number[] = []; // Store created user IDs for cleanup

describe("POST /users", () => {
    let adminToken: string;
    let staffToken: string;

    beforeAll(async () => {
        // Get tokens for admin and staff users
        adminToken = await adminLoginForTest();
        staffToken = await staffLoginForTest();
    });

    it("should return 401 if no token is provided", async () => {
        const response = await request(app).post("/users").send({
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            password: "password123",
            role: "staff"
        });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication token missing");
    });

    it("should return 403 if a staff user tries to access", async () => {
        const response = await request(app)
            .post("/users")
            .set(authHeaders(staffToken))
            .send({
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: "password123",
                role: "staff"
            });
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("message", "Access denied");
    });

    it("should return 400 if required fields, such as firstName, are missing or invalid", async () => {
        const response = await request(app)
            .post("/users")
            .set(authHeaders(adminToken))
            .send({
                lastName: "User",
                email: "test@example.com",
                password: "password123",
                role: "staff"
            });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "All fields are required");
    });

    it("should return 400 if required fields, such as lastName, are malformed or invalid", async () => {
        const response = await request(app)
            .post("/users")
            .set(authHeaders(adminToken))
            .send({
                firstName: "Test",
                lastName: "",
                email: "test@example.com",
                password: "password123",
                role: "staff"
            });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "All fields must be non-empty strings");
    });

    it("should return 400 if required fields, such as email, are malformed or invalid", async () => {
        const response = await request(app)
            .post("/users")
            .set(authHeaders(adminToken))
            .send({
                firstName: "Test",
                lastName: "User",
                password: "password123",
                role: "staff"
            });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "All fields are required");
    });

    it("should return 400 if required fields, such as password, are malformed or invalid", async () => {
        const response = await request(app)
            .post("/users")
            .set(authHeaders(adminToken))
            .send({
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                role: "staff"
            });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "All fields are required");
    });

    it("should return 400 if required fields, such as role, are malformed or invalid", async () => {
        const response = await request(app)
            .post("/users")
            .set(authHeaders(adminToken))
            .send({
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                password: "password123"
            });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "All fields are required");
    });

    it("should return 400 if all required fields are missing", async () => {
        const response = await request(app)
            .post("/users")
            .set(authHeaders(adminToken))
            .send({});
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "All fields are required");
    });

    it("should return 409 if the email is already in use", async () => {
        const response = await request(app)
            .post("/users")
            .set(authHeaders(adminToken))
            .send({
                firstName: "Test",
                lastName: "User",
                email: "staff@hotel.local", // Assuming this email is already in use
                password: "password123456789",
                role: "staff"
            });
        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty("message", "Email already exists");
    });

    it("should return 201 and the created user's information for a staff user (can't be admin), excluding sensitive fields", async () => {
        const newUser = await request(app)
            .post("/users")
            .set(authHeaders(adminToken))
            .send({
                firstName: "Test",
                lastName: "User",
                email: "newstaff@hotel.local",
                password: "password123456789",
                role: "staff"
            });

        // Store the created user's ID for cleanup
        createdUserIds.push(newUser.body.userId);

        expect(newUser.status).toBe(201);
        expect(newUser.body).toHaveProperty("userId");
        expect(newUser.body).toHaveProperty("firstName", "Test");
        expect(newUser.body).toHaveProperty("lastName", "User");
        expect(newUser.body).toHaveProperty("email", "newstaff@hotel.local");
        expect(newUser.body).toHaveProperty("role", "staff");
        expect(newUser.body).toHaveProperty("isActive", true);
        expect(newUser.body).toHaveProperty("createdAt");
        expect(newUser.body).toHaveProperty("updatedAt");

        expect(newUser.body).not.toHaveProperty("password_hash"); // Ensure password_hash is not included in the response
    });

    it("should return 400 if an attempt is made to create a user with the role of admin", async () => {
        const response = await request(app)
            .post("/users")
            .set(authHeaders(adminToken))
            .send({
                firstName: "Test",
                lastName: "User",
                email: "newadmin@hotel.local",
                password: "password123456789",
                role: "admin"
            });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "Only staff users can be created");
    });
});


// Cleanup: Delete any users created during the tests to maintain a clean state

afterEach(async () => {
    for (const userId of createdUserIds) {
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    }
});



// Close the database connection after all tests are done

afterAll(async () => {
    await pool.end();
});


