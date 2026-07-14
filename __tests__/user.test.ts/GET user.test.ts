/*

All user routes are defined here. The following routes are available:

router.post("/users", authenticateToken, authorizeRoles("admin"), createUser);
router.get("/users", authenticateToken, authorizeRoles("admin"), getUsers);
router.get("/users/me", authenticateToken, authorizeRoles("admin", "staff"), getSelfInfo);
router.patch("/users/me", authenticateToken, authorizeRoles("admin", "staff"), updateSelfInfo);
router.patch("/users/:id/deactivate", authenticateToken, authorizeRoles("admin"), deactivateUserById);
router.patch("/users/:id", authenticateToken, authorizeRoles("admin"), updateUserInfo);
*/


/*

In this file, we will define the checklist for testing the GET user routes.

The following routes are available:

router.get("/users", authenticateToken, authorizeRoles("admin"), getUsers);
router.get("/users/me", authenticateToken, authorizeRoles("admin", "staff"), getSelfInfo);

Checklist sample for each route:
| Category          | Question                                              |
| ----------------- | ----------------------------------------------------- |
| Route contract    | Who may access it? Which method/path?                 |
| Success           | What valid outcomes must work?                        |
| Validation        | Which inputs can be missing, malformed, or invalid?   |
| Business rules    | What valid input must still be rejected?              |
| Not found         | Which referenced resource may not exist?              |
| Response contract | Status, body shape, sensitive fields?                 |
| Data effects      | What should be created, changed, or remain unchanged? |
| Cleanup           | What test data must be removed afterward?             |

*/


/*

First, below is the checklist for: router.get("/users", authenticateToken, authorizeRoles("admin"), getUsers);

Route contract:
- Who may access it? Only users with the "admin" role.
- Which method/path? GET /users

Success:
- What valid outcomes must work? The route should return a list of users, excluding sensitive fields like password hashes.

Validation:
- Which inputs can be missing, malformed, or invalid? The route may accept query parameters for filtering (e.g., by id or email). Invalid query parameters should be ignored or result in a 400 error.

Business rules:
- What valid input must still be rejected? If the user is not authenticated or does not have the "admin" role, they should receive a 403 Forbidden response.

Not found:
- Which referenced resource may not exist? If no users match the query parameters, the route should return an empty array.

Response contract:
- Status, body shape, sensitive fields? The response should have a 200 status code and return a JSON array of user objects without sensitive fields.

Data effects:
- What should be created, changed, or remain unchanged? The route should not create or modify any data.

Cleanup:
- What test data must be removed afterward? No test data should be created, so no cleanup is necessary.

*/

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app";
import pool from "../../src/database/db";
import { authHeaders } from "../../src/helpers/authHelper";
import { adminLoginForTest, staffLoginForTest } from "../../src/helpers/loginHelper";

const createdUserIds: number[] = []; // Store created user IDs for cleanup

describe("GET /users", () => {
    let adminToken: string;
    let staffToken: string;

    beforeAll(async () => {
        // Get tokens for admin and staff users
        adminToken = await adminLoginForTest();
        staffToken = await staffLoginForTest();
    });

    it("should return 401 if no token is provided", async () => {
        const response = await request(app).get("/users");
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication token missing");
    });
    
    it("should return 403 if a staff user tries to access", async () => {
        const response = await request(app)
            .get("/users")
            .set(authHeaders(staffToken));
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("message", "Access denied");
    });
    
    it("should return 200 and a list of all users for an admin user when there is no filter, excluding sensitive fields", async () => {
        const response = await request(app)
            .get("/users")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.every((user: any) => ["id","email", "first_name","last_name", "role", "is_active", "created_at", "updated_at"].every(prop => user.hasOwnProperty(prop)))).toBe(true);
        expect(response.body.every((user: any) => !("password_hash" in user))).toBe(true);
    });

    it("should return 200 and an empty list of users when there is no match found based on the provided query parameters", async () => {
        const response = await request(app)
            .get("/users?id=9999")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    it("should return 200 and a filtered list of users when valid query parameters are provided", async () => {
        const response = await request(app)
            .get("/users?id=2")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0]).toHaveProperty("first_name", "Staff");
    });

    it("should return 400 if query parameters such as id are malformed or invalid", async () => {
        const response = await request(app)
            .get("/users?id=invalid")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "id must be a number");
    });

    it("should return 400 if query parameters such as email are malformed or invalid", async () => {
        const response = await request(app)
            .get("/users?email=invalid-email")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "email must be a valid email address");
    });
});


/*

Next, below is the checklist for:
router.get("/users/me", authenticateToken, authorizeRoles("admin", "staff"), getSelfInfo);

Route contract:
- Who may access it? Users with either the "admin" or "staff" role.
- Which method/path? GET /users/me

Success:
- What valid outcomes must work? The route should return the authenticated user's information, excluding sensitive fields like password hashes.

Validation:
- Which inputs can be missing, malformed, or invalid? The route does not accept any query parameters. If the user is not authenticated, they should receive a 401 Unauthorized response.

Business rules:
- What valid input must still be rejected? If the user does not have the "admin" or "staff" role, they should receive a 403 Forbidden response.

Not found:
- Which referenced resource may not exist? Nothing specific; the route should always return the authenticated user's information if they are valid and have the correct role.

Response contract:
- Status, body shape, sensitive fields? The response should have a 200 status code and return a JSON object representing the user without sensitive fields.

Data effects:
- What should be created, changed, or remain unchanged? The route should not create or modify any data.

Cleanup:
- What test data must be removed afterward? No test data should be created, so no cleanup is necessary.

*/

describe("GET /users/me", () => {
    let adminToken: string;
    let staffToken: string;

    beforeAll(async () => {
        // Get tokens for admin and staff users
        adminToken = await adminLoginForTest();
        staffToken = await staffLoginForTest();
    });

    it("should return 401 if no token is provided", async () => {
        const response = await request(app).get("/users/me");
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication token missing");
    });

    it("should return 200 and the authenticated user's information for an admin user, excluding sensitive fields", async () => {
        const response = await request(app)
            .get("/users/me")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(response.body).not.toHaveProperty("password_hash"); // Ensure password_hash is not included in the response

        // The result should include "id","email", "first_name","last_name", "role", "is_active", "created_at", "updated_at"
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("email");
        expect(response.body).toHaveProperty("first_name");
        expect(response.body).toHaveProperty("last_name");
        expect(response.body).toHaveProperty("role", "admin");
        expect(response.body).toHaveProperty("is_active");
        expect(response.body).toHaveProperty("created_at");
        expect(response.body).toHaveProperty("updated_at");
    });

    it("should return 200 and the authenticated user's information for a staff user, excluding sensitive fields", async () => {
        const response = await request(app)
            .get("/users/me")
            .set(authHeaders(staffToken));
        expect(response.status).toBe(200);
        expect(response.body).not.toHaveProperty("password_hash"); // Ensure password_hash is not included in the response

        // The result should include "id","email", "first_name","last_name", "role", "is_active", "created_at", "updated_at"
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("email");
        expect(response.body).toHaveProperty("first_name");
        expect(response.body).toHaveProperty("last_name");
        expect(response.body).toHaveProperty("role", "staff");
        expect(response.body).toHaveProperty("is_active");
        expect(response.body).toHaveProperty("created_at");
        expect(response.body).toHaveProperty("updated_at");
    });

    it("should return 400 if malformed or invalid inputs are provided (e.g., invalid token)", async () => {
        const response = await request(app)
            .get("/users/me")
            .set(authHeaders("invalid_token"));
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("message", "Invalid authentication token");
    });
});



// Close the database connection after all tests are done

afterAll(async () => {
    await pool.end();
});



 
    