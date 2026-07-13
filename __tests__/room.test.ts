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
        expect(response.body).toEqual({ success: false, message: "roomId must be a number" });
    });

    it("should return 400 Bad Request if invalid query parameters (hotelId) are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ hotelId: "invalid" }) // Invalid hotelId
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "hotelId must be a number" });
    });

    it("should return 400 Bad Request if invalid query parameters (type) are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ type: 123 }) // Invalid type
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "type must be a string" });
    });

    it("should return 400 Bad Request if invalid query parameters (price) are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .query({ price: "invalid" }) // Invalid price
            .set(authHeaders(adminToken));
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ success: false, message: "price must be a number" });
    });


    // Below are the scenarios for successful GET /rooms requests (200 OK):

    it("should return 200 OK and all rooms when no filters are provided", async () => {
        const response = await request(app)
            .get("/rooms")
            .set(authHeaders(adminToken));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toEqual(7); // Assuming there are 7 rooms in the database for testing
        expect(response.body).toMatchObject([
            { roomId: 1, hotelId: 10, type: "Single", price: 120 },
            { roomId: 2, hotelId: 10, type: "Double", price: 180 },
        ]);
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

    
