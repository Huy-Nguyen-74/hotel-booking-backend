/*
This file contains integration tests for the following booking routes:

router.get("/bookings", authenticateToken, authorizeRoles("admin", "staff"), getBookings);
router.get("/bookings/:bookingId", authenticateToken, authorizeRoles("admin", "staff"), getBookingById);
router.post("/bookings", authenticateToken, authorizeRoles("admin", "staff"), createBooking);
router.patch("/bookings/:bookingId", authenticateToken, authorizeRoles("admin", "staff"), updateBooking);
router.delete("/bookings/:bookingId", authenticateToken, authorizeRoles("admin"), deleteBooking);
*/

import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../src/app";
import pool from "../src/database/db";
import { authHeaders } from "../src/helpers/authHelper";
import { adminLoginForTest, staffLoginForTest } from "../src/helpers/loginHelper";

const createdBookingIds: number[] = [];

let adminToken = ""; // Stores the JWT once so every protected request in this file can reuse it.
let staffToken = ""; // Stores the JWT once so every protected request in this file can reuse it.

beforeAll(async () => {
  // Logs in once before the test suite starts.
  adminToken = await adminLoginForTest();
  staffToken = await staffLoginForTest();
});

describe("GET /bookings/:bookingId", () => {
  it("returns 401 when no auth token is provided", async () => {
    const response = await request(app).get("/bookings/1");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Authentication token missing",
    });
  });
  
  it("returns 404 when admin requests a booking that does not exist", async () => {
    const response = await request(app).get("/bookings/999").set(authHeaders(adminToken));
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Booking not found",
    });
  });

  it("returns 404 when staff requests a booking that does not exist", async () => {
    const response = await request(app).get("/bookings/999").set(authHeaders(staffToken));
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Booking not found",
    });
  });
});

describe("GET /bookings", () => {
  /*
  Here are a list of filters:
    hotelId?: number;
    roomId?: number;
    guestName?: string;
    checkInDate?: string;
    checkOutDate?: string;

  Checklist:
    - It should return 401 Unauthorized when no token is provided.
    - It should return 400 Bad Request if invalid query parameters are provided.

    - It should return 200 OK and all bookings when no filters are provided.
    - It should return an empty array if no bookings match the filters.
    - It should return 200 OK and an array of bookings if valid filters are provided.
  */

  it("returns 401 when no auth token is provided", async () => {
    const response = await request(app).get("/bookings");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Authentication token missing",
    });
  });

  it("returns 400 when an admin provides invalid query parameters, such as hotelId", async () => {
    const response = await request(app).get("/bookings?hotelId=invalid").set(authHeaders(adminToken));
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "hotelId must be a number",
    });
  });

  it("returns 400 when a staff provides invalid query parameters, such as roomId", async () => {
    const response = await request(app).get("/bookings?roomId=invalid").set(authHeaders(staffToken));
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "roomId must be a number",
    });
  });
  
  // Skip guestName validation for now, since it can be any string, including empty strings.

  // Skip checkInDate and checkOutDate validation for now, since they can be any string, including empty strings.

  it("returns 200 and all bookings when admin provides no filters", async () => {
    const response = await request(app).get("/bookings").set(authHeaders(adminToken));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("returns 200 and an empty array when admin provides filters, such as hotelId, that match no bookings", async () => {
    const response = await request(app).get("/bookings?hotelId=999").set(authHeaders(adminToken));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it("returns 200 and an array of bookings when admin provides valid filters, such as hotelId", async () => {
    const response = await request(app).get("/bookings?hotelId=10").set(authHeaders(adminToken));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe("POST /bookings", () => {
  it("returns 401 when no auth token is provided", async () => {
    const response = await request(app).post("/bookings").send({
      hotelId: 1,
      roomId: 1,
      guestName: "Test Guest",
      checkInDate: "2026-10-01",
      checkOutDate: "2026-10-03",
    });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Authentication token missing",
    });
  });
  
  it("returns 400 when required fields are missing", async () => {
    const response = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 1,
      roomId: 1,
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Missing required fields",
    });
  });

  it("returns 404 when hotel does not exist", async () => {
    const response = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 999,
      roomId: 1,
      guestName: "Invalid Hotel Test",
      checkInDate: "2026-10-01",
      checkOutDate: "2026-10-03",
    });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Hotel not found",
    });
  });

  it("returns 404 when room does not exist in the specified hotel", async () => {
    const response = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 11,
      roomId: 999,
      guestName: "Invalid Room Test",
      checkInDate: "2026-10-10",
      checkOutDate: "2026-10-12",
    });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Room not found in the specified hotel",
    });
  });

  it("returns 400 when checkOutDate is before checkInDate", async () => {
    const response = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 10,
      roomId: 1,
      guestName: "Invalid Date Test",
      checkInDate: "2026-10-10",
      checkOutDate: "2026-10-05",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "checkOutDate must be after checkInDate",
    });
  });

  it("returns 400 when booking dates overlap an existing booking", async () => {
    const response = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 10,
      roomId: 1,
      guestName: "Overlap Test",
      checkInDate: "2026-06-15",
      checkOutDate: "2026-06-22",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Room is already booked for the selected dates",
    });
  });

  it("creates a booking when request data is valid", async () => {
    const response = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 11,
      roomId: 4,
      guestName: "Success Test",
      checkInDate: "2026-12-12",
      checkOutDate: "2026-12-15",
    });

    expect(response.status).toBe(201);

    createdBookingIds.push(response.body.booking.id);

    expect(response.body.message).toBe("Booking created successfully");
    expect(response.body.booking).toMatchObject({
      hotel_id: 11,
      room_id: 4,
      guest_name: "Success Test",
      nights: 3,
      total_price: 510,
    });
  });
});

describe("PATCH /bookings/:bookingId", () => {
  
  it("returns 401 when no auth token is provided", async () => {
    const response = await request(app).patch("/bookings/1").send({
      guestName: "Updated Name",
    });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Authentication token missing",
    });
  });

  it("returns 404 when booking does not exist", async () => {
    const response = await request(app).patch("/bookings/999").set(authHeaders(adminToken)).send({
      guestName: "Updated Name",
    });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Booking not found",
    });
  });

  it("updates a booking when request data is valid", async () => {
    const createResponse = await request(app).post("/bookings").set(authHeaders(staffToken)).send({
      hotelId: 11,
      roomId: 4,
      guestName: "Patch Test",
      checkInDate: "2027-02-01",
      checkOutDate: "2027-02-04",
    });
    expect(createResponse.status).toBe(201);

    const bookingId = createResponse.body.booking.id;
    createdBookingIds.push(bookingId);

    const patchResponse = await request(app).patch(`/bookings/${bookingId}`).set(authHeaders(adminToken)).send({
      guestName: "Patch Test Updated",
      checkInDate: "2027-02-05",
      checkOutDate: "2027-02-08",
    });
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.message).toBe("Booking updated successfully");
    expect(patchResponse.body.booking).toMatchObject({
      id: bookingId,
      hotel_id: 11,
      room_id: 4,
      guest_name: "Patch Test Updated",
      nights: 3,
      total_price: 510,
    });
  });

  it("returns 400 when updated dates are invalid", async () => {
    const createResponse = await request(app).post("/bookings").set(authHeaders(staffToken)).send({
      hotelId: 11,
      roomId: 4,
      guestName: "Invalid Patch Test",
      checkInDate: "2027-03-01",
      checkOutDate: "2027-03-04",
    });
    expect(createResponse.status).toBe(201);

    const bookingId = createResponse.body.booking.id;
    createdBookingIds.push(bookingId);

    const patchResponse = await request(app).patch(`/bookings/${bookingId}`).set(authHeaders(adminToken)).send({
      checkInDate: "2027-03-10",
      checkOutDate: "2027-03-05",
    });
    expect(patchResponse.status).toBe(400);
    expect(patchResponse.body).toEqual({
      success: false,
      message: "checkOutDate must be after checkInDate",
    });
  });

  it("returns 400 when updated dates overlap another booking", async () => {
    const createResponseA = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 11,
      roomId: 4,
      guestName: "Overlap Patch Test",
      checkInDate: "2027-04-01",
      checkOutDate: "2027-04-05",
    });
    expect(createResponseA.status).toBe(201);

    const bookingIdA = createResponseA.body.booking.id;
    createdBookingIds.push(bookingIdA);

    const createResponseB = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 11,
      roomId: 4,
      guestName: "Overlap Patch Test 2",
      checkInDate: "2027-04-10",
      checkOutDate: "2027-04-15",
    });
    expect(createResponseB.status).toBe(201);

    const bookingIdB = createResponseB.body.booking.id;
    createdBookingIds.push(bookingIdB);

    const patchResponse = await request(app).patch(`/bookings/${bookingIdB}`).set(authHeaders(adminToken)).send({
      checkInDate: "2027-04-03",
      checkOutDate: "2027-04-12",
    });

    expect(patchResponse.status).toBe(400);
    expect(patchResponse.body).toEqual({
      success: false,
      message: "Room is already booked for the selected dates",
    });
  });
});

describe("DELETE /bookings/:bookingId", () => {

  it("returns 401 when no auth token is provided", async () => {
    const response = await request(app).delete("/bookings/1");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Authentication token missing",
    });
  });

  it("returns 403 when staff tries to delete a booking", async () => {
    const response = await request(app).delete("/bookings/1").set(authHeaders(staffToken));
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Access denied",
    });
  });

  it("returns 404 when booking does not exist", async () => {
    const response = await request(app).delete("/bookings/999").set(authHeaders(adminToken));
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Booking not found",
    });
  });

  it("deletes a booking when it exists", async () => {
    const createResponse = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 11,
      roomId: 4,
      guestName: "Delete Test",
      checkInDate: "2027-05-01",
      checkOutDate: "2027-05-04",
    });
    expect(createResponse.status).toBe(201);

    const bookingId = createResponse.body.booking.id;

    const deleteResponse = await request(app).delete(`/bookings/${bookingId}`).set(authHeaders(adminToken));
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Booking deleted successfully");
    expect(deleteResponse.body.booking.id).toBe(bookingId);

    const checkResponse = await request(app).get(`/bookings/${bookingId}`).set(authHeaders(adminToken));
    expect(checkResponse.status).toBe(404);
    expect(checkResponse.body).toEqual({
      success: false,
      message: "Booking not found",
    });
  });

  it("returns 404 when trying to delete a booking that was already deleted", async () => {
    const createResponse = await request(app).post("/bookings").set(authHeaders(adminToken)).send({
      hotelId: 11,
      roomId: 4,
      guestName: "Delete Test 2",
      checkInDate: "2027-06-01",
      checkOutDate: "2027-06-04",
    });
    expect(createResponse.status).toBe(201);

    const bookingId = createResponse.body.booking.id;

    const deleteResponse = await request(app).delete(`/bookings/${bookingId}`).set(authHeaders(adminToken));
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Booking deleted successfully");
    expect(deleteResponse.body.booking.id).toBe(bookingId);

    const secondDeleteResponse = await request(app).delete(`/bookings/${bookingId}`).set(authHeaders(adminToken));
    expect(secondDeleteResponse.status).toBe(404);
    expect(secondDeleteResponse.body).toEqual({
      success: false,
      message: "Booking not found",
    });
  });
});

afterEach(async () => {
  for (const bookingId of createdBookingIds) {
    await pool.query("DELETE FROM bookings WHERE id = $1", [bookingId]);
  }

  createdBookingIds.length = 0;
});

afterAll(async () => {
  await pool.end();
});

