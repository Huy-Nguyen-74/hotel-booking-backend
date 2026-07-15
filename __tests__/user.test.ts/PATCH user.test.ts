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
import { create } from "domain";

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


// For this route, we'll need to create temporary users for testing, using SQL.
// We'll use the createAdminUserForTest and createStaffUserForTest helpers to create temporary users for testing.
// We'll clean them up afterwards. We'll store their IDs in an array for cleanup.
// We'll also need to log in as both a temporary admin and a staff user to get their tokens for testing.
// We'll use the tempAdmin and staffLoginForTest helpers to log in and get the tokens, to be used in the tests.
// We'll do all of this by combining into async functions.

async function createTempAdminUserAndLogin(): Promise<string> {
    const tempAdminUser = await createAdminUserForTest(
        "TempAdminFirstName",   
        "TempAdminLastName",
        `tempAdmin${Date.now()}@example.com`,
        "TempAdminPassword123!"
    );
    createdUserIds.push(tempAdminUser.id);
    const tempAdminUserToken = await tempAdminLoginForTest(tempAdminUser.email, "TempAdminPassword123!");
    return tempAdminUserToken;
};

async function createTempStaffUserAndLogin(): Promise<string> {
    const tempStaffUser = await createStaffUserForTest(
        "TempStaffFirstName",
        "TempStaffLastName",
        `tempStaff${Date.now()}@example.com`,
        "TempStaffPassword123!"
    );
    createdUserIds.push(tempStaffUser.id);
    const tempStaffUserToken = await tempStaffLoginForTest(tempStaffUser.email, "TempStaffPassword123!");
    return tempStaffUserToken;
};    

const createdUserIds: number[] = []; // Store created user IDs for cleanup

describe("PATCH /users/me", () => {
  
    it("should return 401 if no token is provided", async () => {
        const response = await request(app).patch("/users/me").send({
            firstName: "UpdatedFirstName",
            lastName: "UpdatedLastName",
            password: "UpdatedPassword123!",
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication token missing");
    });

    // Validation and success cases for staff user:

    it("should return 400 Bad Request if provided fields, such as firstName, are invalid for staff user", async () => {                
        const staffToken = await createTempStaffUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(staffToken)) // Use the staff token
            .send({
                firstName: "", // Invalid firstName
                lastName: "UpdatedLastName",
                password: "UpdatedPassword123!",
            });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "firstName cannot be an empty string");
    });

    it("should return 400 Bad Request if provided fields, such as lastName, are invalid for staff user", async () => {
        const staffToken = await createTempStaffUserAndLogin();
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
        const staffToken = await createTempStaffUserAndLogin();
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

    it("should return 400 Bad Request if no fields are provided for staff user", async () => {  
        const staffToken = await createTempStaffUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(staffToken))
            .send({}); // No fields provided
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "At least one field (firstName, lastName, password) must be provided");
    });

    it("should successfully update staff-user information when only firstName is provided", async () => {
        const staffToken = await createTempStaffUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(staffToken))
            .send({
                firstName: "UpdatedFirstName",
            });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("firstName", "UpdatedFirstName");
        expect(response.body).not.toHaveProperty("password_hash");
    });

    it("should successfully update staff-user information when only lastName is provided", async () => {
        const staffToken = await createTempStaffUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(staffToken))
            .send({
                lastName: "UpdatedLastName",
            });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("lastName", "UpdatedLastName");
        expect(response.body).not.toHaveProperty("password_hash");
    });

    it("should successfully update staff-user information when only password is provided", async () => {
        const staffToken = await createTempStaffUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(staffToken))
            .send({
                password: "UpdatedPassword123!",
            });
        expect(response.status).toBe(200);
        expect(response.body).not.toHaveProperty("password_hash");
    });

    it("should successfully update staff-user information when all 3 valid fields are provided", async () => {
        const staffToken = await createTempStaffUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(staffToken))
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

    // Validation and success cases for admin user:

    it("should return 400 Bad Request if provided fields, such as firstName, are invalid", async () => {
        const adminToken = await createTempAdminUserAndLogin();
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
        const adminToken = await createTempAdminUserAndLogin();
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
        const adminToken = await createTempAdminUserAndLogin();
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
        const adminToken = await createTempAdminUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({}); // No fields provided
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "At least one field (firstName, lastName, password) must be provided");
    });

    it("should successfully update admin-user information when only firstName is provided", async () => {
        const adminToken = await createTempAdminUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({
                firstName: "UpdatedFirstName",
            });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("firstName", "UpdatedFirstName");
        expect(response.body).not.toHaveProperty("password_hash");
    });

    it("should successfully update admin-user information when only lastName is provided", async () => {
        const adminToken = await createTempAdminUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({
                lastName: "UpdatedLastName",
            });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("lastName", "UpdatedLastName");
        expect(response.body).not.toHaveProperty("password_hash");
    });

    it("should successfully update admin-user information when only password is provided", async () => {
        const adminToken = await createTempAdminUserAndLogin();
        const response = await request(app)
            .patch("/users/me")
            .set(authHeaders(adminToken))
            .send({
                password: "UpdatedPassword123!",
            });
        expect(response.status).toBe(200);
        expect(response.body).not.toHaveProperty("password_hash");
    });

    it("should successfully update admin-user information when all 3 valid fields are provided", async () => {
        const adminToken = await createTempAdminUserAndLogin();
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
});

/*
Next, we will test the PATCH /users/:id/deactivate route, which allows authenticated admin users to deactivate other users. Only "admin" role can access this route.

Route contract:
- Who may access it? Only "admin" role can access this route to deactivate other users.
- Which method/path? PATCH /users/:id/deactivate

Success:
- What valid outcomes must work? The route should allow admin users to deactivate other users by their ID.
        The response should return a success message and the deactivated user's information without sensitive fields like password hashes.

Validation:
- Which inputs can be missing, malformed, or invalid?
        The user ID in the URL must be a valid number. If it's not, the route should return a 400 Bad Request response.
        If the user ID does not exist in the database, the route should return a 404 Not Found response.

Business rules:
- What valid input must still be rejected?
        If the user is not authenticated, they should receive a 401 Unauthorized response.
        If the user is authenticated but does not have the "admin" role, they should receive a 403 Forbidden response.

Not found:
- Which referenced resource may not exist? The user being deactivated may not exist. If the user ID does not exist, the route should return a 404 Not Found response.

Response contract:
- Status, body shape, sensitive fields? The response should have a 200 status code and return a JSON object with a success message and the deactivated user's information without sensitive fields.

Data effects:
- What should be created, changed, or remain unchanged? The specified user's isActive status should be set to false in the database.
        The deactivated user's information should be returned in the response without sensitive fields like password hashes.
*/

describe("PATCH /users/:id/deactivate", () => {
    it("should return 401 if no token is provided", async () => {
        const response = await request(app).patch("/users/1/deactivate");
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication token missing");
    });

    it("should return 403 if a non-admin user tries to deactivate another user", async () => {
        const staffToken = await createTempStaffUserAndLogin();
        const response = await request(app)
            .patch("/users/1/deactivate")
            .set(authHeaders(staffToken));
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("message", "Access denied");
    });

    it("should return 400 if the user ID is not a valid number", async () => {
        const adminToken = await createTempAdminUserAndLogin();
        const response = await request(app)
            .patch("/users/invalid-id/deactivate")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "Invalid user id");
    });

    it("should return 404 if the user ID does not exist", async () => {
        const adminToken = await createTempAdminUserAndLogin();
        const response = await request(app)
            .patch("/users/999999/deactivate") // Assuming this ID does not exist
            .set(authHeaders(adminToken));
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("message", "User not found");
    });

    it("should successfully deactivate a user when requested by an admin", async () => {
        const adminToken = await createTempAdminUserAndLogin();
        const tempStaffUser = await createStaffUserForTest(
            "TempStaffFirstNameForDeactivation",
            "TempStaffLastNameForDeactivation",
            `tempStaffForDeactivation${Date.now()}@example.com`,
            "TempStaffPassword123!"
        );
        createdUserIds.push(tempStaffUser.id);

        const response = await request(app)
            .patch(`/users/${tempStaffUser.id}/deactivate`)
            .set(authHeaders(adminToken));
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "User deactivated successfully");
        expect(response.body).toHaveProperty("body");
        expect(response.body.body).toHaveProperty("id", tempStaffUser.id);
        expect(response.body.body).toHaveProperty("isActive", false);
        expect(response.body.body).not.toHaveProperty("password_hash");
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



