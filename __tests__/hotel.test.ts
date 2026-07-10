import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import pool from "../src/database/db";
import { authHeaders } from "../src/helpers/authHelper";
import { adminLoginForTest, staffLoginForTest } from "../src/helpers/loginHelper";

const createdHotelIds: number[] = [];

/*

This test suite is designed to test the hotel-related endpoints of the application. 
It uses Jest for testing and Supertest for making HTTP requests to the Express application.

3 endpoints are tested:
    1. GET /hotels - Retrieves a list of hotels.
    2. POST /hotels - Creates a new hotel.
    3. PATCH /hotels/:hotelId - Updates an existing hotel.
*/



/* First, we will test the GET /hotels endpoint:
    - It should return 400 Bad Request if invalid query parameters are provided (id, city).
    - It should return 401 Unauthorized when no token is provided.

    - It should return 200 OK and all hotels when no filters are provided.
    - It should return an empty array if no hotels match the filters.
    - It should return 200 OK and an array of hotels if valid filters are provided.
    
*/

describe("GET /hotels", () => {

    // Before running the tests, we need to log in to get a valid JWT token for authentication.
    // For GET, either admin or staff can access, so we will use an admin token for testing.

    let adminToken: string;

    beforeAll(async () => {
        adminToken = await adminLoginForTest();
    });

    it("should return 400 Bad Request for invalid query parameters, such as when id is not a number", async () => {
        const response = await request(app)
            .get("/hotels")
            .query({ hotelId: "invalid" }) // Invalid hotelId
            .set(authHeaders(adminToken)); // Set the Authorization header with the token

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "hotelId must be a number" });
    });

       it("should return 401 Unauthorized when no token is provided", async () => {
        const response = await request(app)
            .get("/hotels"); // No Authorization header

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            message: "Authentication token missing" });
    });

    it("should return 200 OK and all hotels when no filters are provided", async () => {
        const response = await request(app)
            .get("/hotels")
            .set(authHeaders(adminToken)); // Set the Authorization header with the token

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // The response should be an array
    });

    it("should return 200 OK and an empty array if no hotels match the filters, in terms of city", async () => {
        const response = await request(app)
            .get("/hotels")
            .query({ city: "NonExistentCity" }) // Assuming this city has no hotels
            .set(authHeaders(adminToken)); // Set the Authorization header with the token
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]); // The response should be an empty array
    });

    it("should return 200 OK and an empty array if no hotels match the filters, in terms of hotelId", async () => {
        const response = await request(app)
            .get("/hotels")
            .query({ hotelId: 9999 }) // Assuming this hotelId has no hotels
            .set(authHeaders(adminToken)); // Set the Authorization header with the token
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]); // The response should be an empty array
    });

    it("should return 200 OK and an empty array if no hotels match the filters, in terms of both hotelId and city", async () => {
        const response = await request(app)
            .get("/hotels")
            .query({ hotelId: 9999, city: "NonExistentCity" }) // Assuming this combination has no hotels
            .set(authHeaders(adminToken)); // Set the Authorization header with the token
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]); // The response should be an empty array
    });

    it("should return 200 OK and an array of hotels if valid filters are provided", async () => {
        const response = await request(app)
            .get("/hotels")
            .query({ city: "Tokyo" }) // Assuming this city has hotels
            .set(authHeaders(adminToken)); // Set the Authorization header with the token
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        expect(Array.isArray(response.body)).toBe(true); // The response should be an array
    });
});


/* Next, we will test the POST /hotels endpoint:
    - It should return 401 Unauthorized when no token is provided.
    - It should return 403 Forbidden when a non-admin user tries to create a hotel.

    - It should return 400 Bad Request if required fields (name, city) are missing or empty after trimming.
    - It should return 400 Bad Request if the request body is not a valid JSON object.
    - It should return 400 Bad Request if both required fields (lowercased name, lowercased city) already exist in the database (duplicate hotel).
    - It should return 201 Created and the created hotel object when valid data is provided, divided into the following scenarios:
        - When both name and city don't exist in the database.
        - When name exists but city doesn't exist in the database.
        - When city exists but name doesn't exist in the database.
*/

describe("POST /hotels", () => {
    it("should return 401 Unauthorized when no token is provided", async () => {
        const response = await request(app)
            .post("/hotels")
            .send({ name: "New Hotel", city: "New City" }); // No Authorization header
        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            message: "Authentication token missing" });
    });

    it("should return 403 Forbidden when a non-admin user tries to create a hotel", async () => {
        const staffToken = await staffLoginForTest(); // Get a valid staff token
        const response = await request(app)
            .post("/hotels")
            .set(authHeaders(staffToken)) // Set the Authorization header with the staff token
            .send({ name: "New Hotel", city: "New City" });
        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            success: false,
            message: "Access denied" });
    });

    // From here on, we will use an admin token for testing the POST /hotels endpoint.

    it("should return 400 Bad Request if required fields (name, city) are missing or empty after trimming", async () => {
        const adminToken = await adminLoginForTest(); // Get a valid admin token
        const response = await request(app)
            .post("/hotels")
            .set(authHeaders(adminToken)) // Set the Authorization header with the admin token
            .send({ name: "  ", city: "  " }); // Empty strings after trimming
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "name and city are required and must be non-empty strings" });
    });

    it("should return 400 Bad Request if the request body is not a valid JSON object", async () => {
        const adminToken = await adminLoginForTest();
        const response = await request(app)
            .post("/hotels")
            .set(authHeaders(adminToken))
            .set("Content-Type", "application/json")
            .send('{"name":"Bad Hotel","city":"Tokyo"'); // missing closing }
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "Request body must be a valid JSON object" });
    });

    it("should return 400 Bad Request if both required fields (lowercased name, lowercased city) already exist in the database (duplicate hotel)", async () => {
        const adminToken = await adminLoginForTest();
        const response = await request(app)
            .post("/hotels")
            .set(authHeaders(adminToken))
            .send({ name: "Tokyo Grand Hotel", city: "Tokyo" });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "Hotel already exists" });
    });


    //Below are the scenarios for successful hotel creation (201 Created):

    it("should return 201 Created and the created hotel object when valid data is provided, when both name and city don't exist in the database", async () => {

        const adminToken = await adminLoginForTest();
        const response = await request(app)
            .post("/hotels")
            .set(authHeaders(adminToken))
            .send({ name: "New Hotel", city: "New City" });
        expect(response.status).toBe(201);
        createdHotelIds.push(response.body.id);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("New Hotel");
        expect(response.body.city).toBe("New City");
    });

    it("should return 201 Created and the created hotel object when valid data is provided, when name exists but city doesn't exist in the database", async () => {

        const adminToken = await adminLoginForTest();
        const response = await request(app)
            .post("/hotels")
            .set(authHeaders(adminToken))
            .send({ name: "Tokyo Grand Hotel", city: "New City" });
        expect(response.status).toBe(201);
        createdHotelIds.push(response.body.id);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("Tokyo Grand Hotel");
        expect(response.body.city).toBe("New City");
    });

    it("should return 201 Created and the created hotel object when valid data is provided, when city exists but name doesn't exist in the database", async () => {

        const adminToken = await adminLoginForTest();
        const response = await request(app)
            .post("/hotels")
            .set(authHeaders(adminToken))
            .send({ name: "New Hotel", city: "Tokyo" });
        expect(response.status).toBe(201);
        createdHotelIds.push(response.body.id);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("New Hotel");
        expect(response.body.city).toBe("Tokyo");
    });
});



/* Finally, we will test the PATCH /hotels/:hotelId endpoint:
    - It should return 401 Unauthorized when no token is provided.
    - It should return 403 Forbidden when a non-admin user tries to update a hotel.

    - It should return 400 Bad Request if hotelId is not a valid number.
    - It should return 400 Bad Request if both required fields (name, city) are missing or empty after trimming.
    - It should return 400 Bad Request if the request body is not a valid JSON object.
    - It should return 404 Not Found if the hotel with the given hotelId does not exist.
    - It should return 400 Bad Request if both required fields (trimmed name, trimmed city) already exist in the database (duplicate hotel).
    
    - It should return 200 OK and the updated hotel object when valid data is provided, divided into the following scenarios:
        - When both name and city are provided and valid.
        - When only name is provided and valid.
        - When only city is provided and valid.
*/

describe("PATCH /hotels/:hotelId", () => {
    it("should return 401 Unauthorized when no token is provided", async () => {
        const response = await request(app)
            .patch("/hotels/10");
        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            success: false,
            message: "Authentication token missing"
        });
    });

    it("should return 403 Forbidden when a non-admin user tries to update a hotel", async () => {
        const staffToken = await staffLoginForTest();
        const response = await request(app)
            .patch("/hotels/10")
            .set(authHeaders(staffToken));
        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            success: false,
            message: "Access denied"
        });
    });

    // From here on, we will use an admin token for testing the PATCH /hotels/:hotelId endpoint.

    let adminToken: string;

    beforeAll(async () => {
        adminToken = await adminLoginForTest();
    });

    it("should return 400 Bad Request if hotelId is not a valid number", async () => {
        const response = await request(app)
            .patch("/hotels/invalid") // Invalid hotelId
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "hotelId must be a number"
        });
    });

    it("should return 400 Bad Request if both required fields (name, city) are missing or empty after trimming", async () => {
        const response = await request(app)
            .patch("/hotels/10") // Assuming hotelId 10 exists
            .set(authHeaders(adminToken))
            .send({ name: "  ", city: "  " });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "At least one of name or city must be provided and must be non-empty strings"
        });
    });

    it("should return 400 Bad Request if the request body is not a valid JSON object", async () => {
        const response = await request(app)
            .patch("/hotels/10")
            .set(authHeaders(adminToken))
            .set("Content-Type", "application/json")
            .send('{"name":"Bad Hotel","city":"Tokyo"');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "Request body must be a valid JSON object"
        });
    });
    
    it("should return 404 Not Found if the hotel with the given hotelId does not exist", async () => {
        const response = await request(app)
            .patch("/hotels/9999") // Assuming this hotelId does not exist
            .set(authHeaders(adminToken))
            .send({ name: "Updated Hotel", city: "Updated City" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            message: "Hotel not found"
        });
    });
    
    it("should return 400 Bad Request if both required fields (trimmed name, trimmed city) already exist in the database (duplicate hotel)", async () => {
        const response = await request(app)
            .patch("/hotels/10") // Assuming hotelId 10 exists
            .set(authHeaders(adminToken))
            .send({ name: "Tokyo Grand Hotel", city: "Tokyo" }); // Assuming this combination already exists
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "Hotel already exists"
        });
    });

    // Below are the scenarios for successful hotel updates (200 OK):

    it("should return 200 OK and the updated hotel object when both name and city are provided and valid", async () => {
        const response = await request(app)
            .patch("/hotels/10") // Assuming hotelId 10 exists
            .set(authHeaders(adminToken))
            .send({ name: "Updated Hotel", city: "Updated City" });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("Updated Hotel");
        expect(response.body.city).toBe("Updated City");
    });

    it("should return 200 OK and the updated hotel object when only name is provided and valid", async () => {
        const response = await request(app)
            .patch("/hotels/10") // Assuming hotelId 10 exists
            .set(authHeaders(adminToken))
            .send({ name: "Updated Hotel Name" });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("Updated Hotel Name");
    });

    it("should return 200 OK and the updated hotel object when only city is provided and valid", async () => {
        const response = await request(app)
            .patch("/hotels/10") // Assuming hotelId 10 exists
            .set(authHeaders(adminToken))
            .send({ city: "Updated City Name" });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id");
        expect(response.body.city).toBe("Updated City Name");
    });
});

afterEach(async () => {
    for (const hotelId of createdHotelIds) {
        await pool.query("DELETE FROM hotels WHERE id = $1", [hotelId]);
    }

    createdHotelIds.length = 0;
});

afterAll(async () => {
    await pool.end();
});

