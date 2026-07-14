/*
In this file, we are testing the PATCH /users/:id route of the userController.
The route is protected and requires authentication and authorization.

Routes:
- router.patch("/users/me", authenticateToken, authorizeRoles("admin", "staff"), updateSelfInfo);
- router.patch("/users/:id/deactivate", authenticateToken, authorizeRoles("admin"), deactivateUserById);
- router.patch("/users/:id", authenticateToken, authorizeRoles("admin"), updateUserInfo);
*/

import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app";
import pool from "../../src/database/db";
import { authHeaders } from "../../src/helpers/authHelper";
import { tempAdminLoginForTest, tempStaffLoginForTest } from "../../src/helpers/loginHelper";
import { createAdminUserForTest, createStaffUserForTest } from "../../src/helpers/createUserHelper";

const createdUserIds: number[] = []; // Store created user IDs for cleanup

/*
First, we will test the PATCH /users/me route, which allows authenticated users to update their own information. Both "admin" and "staff" roles can access this route.

Route contract:
- Who may access it? Both "admin" and "staff" roles can access this route to update their own information.
- Which method/path? PATCH /users/me

Success:
- What valid outcomes must work? The route should allow users to update their firstName, lastName, and password.
        The response should return the updated user information without sensitive fields like password hashes.
        Needs to write both cases for admin and staff users, as both can access this route.

Validation:
- Which inputs can be missing, malformed, or invalid?
        The request body can include firstName, lastName, and password. If any of these fields are provided, they must be valid strings. Missing fields will not be updated.
        At least one of the fields (firstName, lastName, password) must be provided in the request body. If none are provided, the route should return a 400 Bad Request response.
        Needs to write both cases for admin and staff users, as both can access this route 
            (for both cases, we'll intentionally create new users with valid credentials, then attempt to update their information with invalid data to test validation, with proper cleanup afterwards).

Business rules:
- What valid input must still be rejected?
        If the user is not authenticated, they should receive a 401 Unauthorized response.

Not found:
- Which referenced resource may not exist? Not applicable for this route, as it operates on the authenticated user's own information.

Response contract:
- Status, body shape, sensitive fields? The response should have a 200 status code and return a JSON object representing the updated user without sensitive fields.

Data effects:
- What should be created, changed, or remain unchanged? The user's information should be updated in the database.
*/

describe("PATCH /users/me", () => {
  
    // For this route, we'll need to create temporary users for testing, using SQL.
    // We'll use the createAdminUserForTest and createStaffUserForTest helpers to create temporary users for testing.
    // We'll clean them up afterwards. We'll store their IDs in an array for cleanup.
    // We'll also need to log in as both a temporary admin and a staff user to get their tokens for testing.
    // We'll store their tokens in variables for use in the tests.
    // We'll use the tempAdmin and staffLoginForTest helpers to log in and get the tokens.

    let tempAdminUserToken: string;
    let tempStaffUserToken: string;

    it("should return 401 if no token is provided", async () => {
        const response = await request(app).patch("/users/me").send({
            firstName: "UpdatedFirstName",
            lastName: "UpdatedLastName",
            password: "UpdatedPassword123!",
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication token missing");
    });


    // Validation cases for staff user:

    it("should return 400 Bad Request if provided fields, such as firstName, are invalid for staff user", async () => {
        
        const tempStaffUser = await createStaffUserForTest(
            "TempStaffFirstName",
            "TempStaffLastName",
            `tempstaff${Date.now()}@example.com`,
            "TempStaffPassword123!"
        );

        const tempStaffUserToken = await tempStaffLoginForTest(tempStaffUser.email, "TempStaffPassword123!");
        
        const tempStaffUserResponse = await request(app)
            .post("/users")
            .set(authHeaders(tempStaffUserToken))
            .send({
                firstName: "TempnStaffFirstName",
                lastName: "TempStaffLastName",
                email: `tempstaff${Date.now()}@example.com`,
                password: "TempStaffPassword123!",
                role: "staff",
            });

        expect(tempStaffUserResponse.status).toBe(201);

        createdUserIds.push(tempStaffUserResponse.body.id);

                
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(tempStaffUserToken))
            .send({
                firstName: "", // Invalid firstName
                lastName: "UpdatedLastName",
                password: "UpdatedPassword123!",
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "firstName cannot be an empty string");
    });

    it("should return 400 Bad Request if provided fields, such as lastName, are invalid for staff user", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(staffToken))
            .send({
                firstName: "UpdatedFirstName",
                lastName: "", // Invalid lastName
                password: "UpdatedPassword123!",
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "lastName cannot be an empty string");
    });

    it("should return 400 Bad Request if provided fields, such as password, are invalid for staff user", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(staffToken))
            .send({
                firstName: "UpdatedFirstName",
                lastName: "UpdatedLastName",
                password: "", // Invalid password
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "password cannot be an empty string");
    });


    // Failed validation cases for admin user:

    it("should return 400 Bad Request if provided fields, such as firstName, are invalid", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({
                firstName: "", // Invalid firstName
                lastName: "UpdatedLastName",
                password: "UpdatedPassword123!",
            });
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "firstName cannot be an empty string");
    });

    it("should return 400 Bad Request if provided fields, such as lastName, are invalid", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({
                firstName: "UpdatedFirstName",
                lastName: "", // Invalid lastName
                password: "UpdatedPassword123!",
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "lastName cannot be an empty string");
    });

    it("should return 400 Bad Request if provided fields, such as password, are invalid", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({
                firstName: "UpdatedFirstName",
                lastName: "UpdatedLastName",
                password: "", // Invalid password
            })

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "password cannot be an empty string");
    });
    
    it("should return 400 Bad Request if no fields are provided", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({}); // No fields provided

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "At least one field (firstName, lastName, password) must be provided");
    });

    
    
    // Success cases for admin user:

    it("should successfully update admin-user information when all 3 valid fields are provided", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({
                firstName: "UpdatedFirstName",
                lastName: "UpdatedLastName",
                password: "UpdatedPassword123!",
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("firstName", "UpdatedFirstName");
        expect(response.body).toHaveProperty("lastName", "UpdatedLastName");
        expect(response.body).not.toHaveProperty("password_hash");
    });

    it("should successfully update admin-user information when only firstName is provided", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({
                firstName: "UpdatedFirstName",
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("firstName", "UpdatedFirstName");
        expect(response.body)
        expect(response.body).not.toHaveProperty("password_hash");
    });





// Cleanup after each test
afterEach(async () => {
  for (const userId of createdUserIds) {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  }
  createdUserIds.length = 0;
});

// Close the database connection after all tests
afterAll(async () => {
  await pool.end();
});



