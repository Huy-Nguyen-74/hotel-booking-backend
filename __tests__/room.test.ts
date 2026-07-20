import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import pool from "../src/database/db";
import { authHeaders } from "../src/helpers/authHelper";
import { adminLoginForTest, staffLoginForTest } from "../src/helpers/loginHelper";

/*

This test suite is designed to test the room-related endpoints of the application. 
It uses Jest for testing and Supertest for making HTTP requests to the Express application.

3 endpoints are tested:
    1. GET /rooms - Retrieves a list of rooms.
    2. POST /rooms - Creates a new room.
    3. PATCH /rooms/:roomId - Updates an existing room.
*/



/* First, we will test the GET /rooms endpoint:
    - It should return 401 Unauthorized when no token is provided.
    - It should return 400 Bad Request if invalid query parameters are provided (roomId, hotelId, type, price).

    - It should return 200 OK and all rooms when no filters are provided.
    - It should return an empty array if no rooms match the filters.
    - It should return 200 OK and an array of rooms if valid filters are provided.
    
*/

// Store created room IDs for cleanup after tests
let createdRoomIds: number[] = [];

describe("GET /rooms", () => {

    // For GET endpoint, can try either admmin or staff token. Let's go with admin.

    let adminToken: string;

    beforeAll(async () => {
        adminToken = await adminLoginForTest();
    });
    
    
    // First, we will test the failure scenarios for GET /rooms endpoint.

    it("should return 401 Unauthorized when no token is provided", async () => {
        const response = await request(app)
            .get("/rooms");
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ success: false, message: "Authentication token missing" });
    });

    it("should return 400 Bad Request if invalid query parameters (roomId) are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ roomId: "invalid" }) // Invalid roomId
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "roomId must be a positive integer" });
    });

    it("should return 400 Bad Request if invalid query parameters (hotelId) are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ hotelId: "invalid" }) // Invalid hotelId
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "hotelId must be a positive integer" });
    });

    it("should return 400 Bad Request if invalid query parameters (type) are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ type: ["Single", "Double"] }) // Non-string scalar shape (array)
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "type must be a non-empty string" });
    });

    it("should return 400 Bad Request if invalid query parameters (price) are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ price: "invalid" }) // Invalid price
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "price must be a positive number" });
    });


    // Below are the scenarios for successful GET /rooms requests (200 OK):

    it("should return 200 OK and all rooms when no filters are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(7);
        expect(response.body).toEqual(expect.arrayContaining([
            { roomId: 1, hotelId: 10, type: "Single", price: 120 },
            { roomId: 2, hotelId: 10, type: "Double", price: 180 },
        ]));
    });

    it("should return 200 OK and an empty array if no rooms match the room filters", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ roomId: 9999 }) // Assuming no rooms exist for this roomId
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("should return 200 OK and an empty array if no rooms match the hotel filters", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ hotelId: 9999 }) // Assuming no rooms exist for this hotelId
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });
    
    it("should return 200 OK and an empty array if no rooms match the type filters", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ type: "Penthouse" }) // Assuming no rooms exist for this type
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("should return 200 OK and an empty array if no rooms match the price filters", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ price: 9999 }) // Assuming no rooms exist for this price
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    // Lastly, 200 OK cases when valid filters are provided.

    it("should return 200 OK and an array of rooms if valid roomId filters are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ roomId: 1 }) // Assuming roomId 1 exists
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toMatchObject([{ roomId: 1, hotelId: 10, type: "Single", price: 120 }]);
    });

    it("should return 200 OK and an array of rooms if valid hotelId filters are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ hotelId: 12 }) // Assuming hotelId 12 exists
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toEqual(2); // Assuming there are 2 rooms for hotelId 12
    });

    it("should return 200 OK and an array of rooms if valid type filters are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ type: "Double" }) // Assuming rooms of type "Double" exist
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toEqual(3); // Assuming there are 3 rooms of type "Double"
    });

    it("should return 200 OK and an array of rooms if valid price filters are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ price: 320 }) // Assuming rooms with price 320 exist
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(expect.arrayContaining([
            expect.objectContaining({ roomId: 5, price: 320 }),
        ]));
    });

    it("should return 200 OK and an array of rooms if multiple valid filters are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ roomId: 6,hotelId: 12, type: "Double", price: 160 }) // Assuming rooms exist for this combination
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toEqual(1); // Assuming there is 1 room for this combination
        expect(response.body[0]).toMatchObject({ roomId: 6, hotelId: 12, type: "Double", price: 160 });
    });
});


/*
Next, we will test the POST /rooms endpoint:
    - It should return 401 Unauthorized when no token is provided.
    - It should return 403 Forbidden when a non-admin token is provided.

    - It should return 400 Bad Request if required fields (hotelId, type, price) are missing or invalid. Separate tests will be written for missing and invalid cases for each required field.

    - It should return 201 Created and the created room object with trimmed fields when valid data is provided. Since duplicate rooms are allowed, we will not check for duplicates in this test.
*/

describe("POST /rooms", () => {
    it("should return 401 Unauthorized when no token is provided", async () => {
        const response = await request(app)
            .post("/rooms")
            .send({ hotelId: 10, type: "Suite", price: 300 });
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ success: false, message: "Authentication token missing" });
    });

    it("should return 403 Forbidden when a non-admin token is provided", async () => {
        const staffToken = await staffLoginForTest();
        const response = await request(app)
            .post("/rooms")
            .set(authHeaders(staffToken))
            .send({ hotelId: 10, type: "Suite", price: 300 });
        expect(response.status).toBe(403);
        expect(response.body).toEqual({ success: false, message: "Access denied" });
    });


    // Next, we will use an admin token for testing the POST /rooms endpoint, including both failure and success scenarios.

    // First, we will test the failure scenarios for POST /rooms endpoint.

    let adminToken: string;

    beforeAll(async () => {
        adminToken = await adminLoginForTest();
    });

    it("should return 400 Bad Request if a required field such as hotelId is missing", async () => {
        const response = await request(app)
            .post("/rooms")
            .set(authHeaders(adminToken))
            .send({ type: "Suite", price: 300 });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "hotelId is required" });
    });

    it("should return 400 Bad Request if a required field such as hotelId is invalid", async () => {
        const response = await request(app)
            .post("/rooms")
            .set(authHeaders(adminToken))
            .send({ hotelId: "invalid", type: "Suite", price: 300 });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "hotelId must be a number" });
    });

    it("should return 400 Bad Request if a required field such as type is missing", async () => {
        const response = await request(app)
            .post("/rooms")
            .set(authHeaders(adminToken))
            .send({ hotelId: 10, price: 300 });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "type is required" });
    });

    it("should return 400 Bad Request if a required field such as type is invalid after trimming", async () => {
        const response = await request(app)
            .post("/rooms")
            .set(authHeaders(adminToken))
            .send({ hotelId: 10, type: "   ", price: 300 });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "type must be a non-empty string" });
    });

    it("should return 400 Bad Request if a required field such as price is missing", async () => {
        const response = await request(app)
            .post("/rooms")
            .set(authHeaders(adminToken))
            .send({ hotelId: 10, type: "Suite" });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "price is required" });
    });

    it("should return 400 Bad Request if a required field such as price is invalid", async () => {
        const response = await request(app)
            .post("/rooms")
            .set(authHeaders(adminToken))
            .send({ hotelId: 10, type: "Suite", price: -100 });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "price must be a positive number" });

        createdRoomIds.push(response.body.roomId); // Store the created room ID for cleanup
    });

    // Lastly, we will test the success scenario for POST /rooms endpoint.

    it("should return 201 Created and the created room object with trimmed fields when valid data is provided", async () => {
        const response = await request(app)
            .post("/rooms")
            .set(authHeaders(adminToken))
            .send({ hotelId: 10, type: "  Quadruple  ", price: 320 });
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            hotelId: 10,
            type: "Quadruple",
            price: 320
        });
    });
});


/* Finally, we will test the PATCH /rooms/:roomId endpoint:
    - It should return 401 Unauthorized when no token is provided.
    - It should return 403 Forbidden when a non-admin token is provided.

    - It should return 400 Bad Request if the roomId parameter is invalid.
    - It should return 400 Bad Request if both required fields (type, price) are missing or invalid. Separate tests will be written for missing and invalid cases for each required field.
    - It should return 404 Not Found if the roomId does not exist in the database.

    - It should return 200 OK and the updated room object with trimmed fields when valid data is provided. Since duplicate rooms are allowed, we will not check for duplicates in this test.
        (for this, we'll create a room first, then update it, and finally delete it to clean up after the test)
*/

describe("PATCH /rooms/:roomId", () => {
    it("should return 401 Unauthorized when no token is provided", async () => {
        const response = await request(app)
            .patch("/rooms/1");
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ success: false, message: "Authentication token missing" });
    });

    it("should return 403 Forbidden when a non-admin token is provided", async () => {
        const staffToken = await staffLoginForTest();
        const response = await request(app)
            .patch("/rooms/1")
            .set(authHeaders(staffToken));
        expect(response.status).toBe(403);
        expect(response.body).toEqual({ success: false, message: "Access denied" });
    });

    // Next, we will use an admin token for testing the PATCH /rooms/:roomId endpoint, including both failure and success scenarios.

    let adminToken: string;

    beforeAll(async () => {
        adminToken = await adminLoginForTest();
    });

    // First, we will test the failure scenarios for PATCH /rooms/:roomId endpoint.

    it("should return 400 Bad Request if the roomId parameter is invalid", async () => {
        const response = await request(app)
            .patch("/rooms/invalid")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "roomId must be a positive integer" });
    });

    it("should return 400 Bad Request if both required fields (type, price) are missing", async () => {
        const response = await request(app)
            .patch("/rooms/1")
            .set(authHeaders(adminToken))
            .send({}); // Sending an empty body to simulate missing required fields
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "At least one of type or price must be provided" });
    });

    it("should return 400 Bad Request if both required fields (type, price) are invalid", async () => {
        const response = await request(app)
            .patch("/rooms/1")
            .set(authHeaders(adminToken))
            .send({ type: "   ", price: -100 });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "type must be a non-empty string" });
    });

    it("should return 404 Not Found if the roomId does not exist in the database", async () => {
        const response = await request(app)
            .patch("/rooms/9999") // Assuming roomId 9999 does not exist
            .set(authHeaders(adminToken))
            .send({ type: "Updated Type" });
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ success: false, message: "Room not found" });
    });

    // Lastly, we will test the success scenario for PATCH /rooms/:roomId endpoint.

    it("should return 200 OK and the updated room object with trimmed fields when valid data is provided", async () => {
        // First, create a room to update
        const createResponse = await request(app)
            .post("/rooms")
            .set(authHeaders(adminToken))
            .send({ hotelId: 10, type: "Suite", price: 280 });
        const roomId = createResponse.body.roomId;
        createdRoomIds.push(roomId);

        const response = await request(app)
            .patch(`/rooms/${roomId}`)
            .set(authHeaders(adminToken))
            .send({ type: "Double", price: 180 });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            roomId,
            hotelId: 10,
            type: "Double",
            price: 180
        });
    });
});


// Cleanup after tests: Delete any rooms created during the tests and close the database connection.

afterEach(async () => {
    // Cleanup: Delete any rooms created during the tests
    if (createdRoomIds.length > 0) {
        await pool.query("DELETE FROM rooms WHERE id = ANY($1)", [createdRoomIds]);
        createdRoomIds = []; // Reset the array after cleanup
    }
});

afterAll(async () => {
    // Close the database connection after all tests are done
    await pool.end();
});




