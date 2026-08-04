import { afterAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app";
import pool from "../../src/database/db";

import { CreateBookingInput } from "../../src/types/booking";

/*
This test suite is for guest booking functionality. It covers the following scenarios:
- [ ] Create a booking as an authenticated guest
- [ ] Store `guest_user_id` as the booking owner
- [ ] Store `created_by_user_id` as the authenticated actor
- [ ] View booking history
- [ ] View booking details
- [ ] Update booking
- [ ] Cancel booking

We divide these scenarios into 5 endpoints, each with its own set of tests:
- [ ] guestCreateBooking: router.post('/guests/bookings', authenticateToken, authorizeRoles('guest'), guestCreateBooking);
- [ ] guestViewAllBookingHistory: router.get('/guests/bookings', authenticateToken, authorizeRoles('guest'), guestViewAllBookingHistory);
- [ ] guestViewOneSpecificBooking: router.get('/guests/bookings/:bookingId', authenticateToken, authorizeRoles('guest'), guestViewOneSpecificBooking);
- [ ] guestUpdateTheirOwnBooking: router.patch('/guests/bookings/:bookingId', authenticateToken, authorizeRoles('guest'), guestUpdateTheirOwnBooking);
- [ ] cancelOwnBooking: router.post('/guests/bookings/:bookingId/cancel', authenticateToken, authorizeRoles('guest'), cancelOwnBooking);

Seed data for testing:

  INSERT INTO hotels (id, name, city)
  VALUES
    (10, 'Tokyo Grand Hotel', 'Tokyo'),
    (11, 'Osaka Bay Hotel', 'Osaka'),
    (12, 'Kyoto Garden Inn', 'Kyoto');

  INSERT INTO rooms (id, hotel_id, type, price)
  VALUES
    (1, 10, 'Single', 120),
    (2, 10, 'Double', 180),
    (3, 11, 'Single', 110),
    (4, 11, 'Double', 170),
    (5, 11, 'Quadruple', 320),
    (6, 12, 'Double', 160),
    (7, 12, 'Suite', 280);

Expected response body:
  bookingId
  hotelId
  roomId
  guestName
  guestUserId
  createdByUserId
  checkInDate
  checkOutDate
  nights
  totalPrice
  status    
*/

const createdBookingIds: number[] = [];

afterEach(async () => {
    // Clean up created bookings after each test
    for (const bookingId of createdBookingIds) {
        await pool.query("DELETE FROM bookings WHERE id = $1", [bookingId]);
    }
    createdBookingIds.length = 0; // Clear the array
});

afterAll(async () => {
    // Close the database connection after all tests
    await pool.end();
});

// First, create a guest user and obtain a JWT token for authentication.
// This will be used across all tests in this suite to simulate an authenticated guest user.
// After all tests, we will clean up by deleting the created guest user from the database.

let guestToken: string;

beforeAll(async () => {
    const guestResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123456789"
      });
    expect(guestResponse.status).toBe(201);
    expect(guestResponse.body).toHaveProperty("token");
    expect(guestResponse.body).toHaveProperty("userId");
    expect(guestResponse.body).toHaveProperty("firstName", "John");
    expect(guestResponse.body).toHaveProperty("lastName", "Doe");
    expect(guestResponse.body).toHaveProperty("email", "john.doe@example.com");
    
    guestToken = guestResponse.body.token;
});

// Delete the created guest user after all tests
afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", ["john.doe@example.com"]);
});


describe("Create a booking as an authenticated guest", () => {
  /*
  [HTTP METHOD] [PATH]: POST /guests/bookings

  Access:
  - Who can access? -> Authenticated guests only.
  - Unauthenticated → 401 Unauthorized.
  - Unauthorized role/ownership → 403 Forbidden.

  Success:
  - Valid request → 201 Created.
  - Expected response body: see above for required fields.

   - Expected database effect:
      A new booking record is created in the database with the correct `guest_user_id` and `created_by_user_id`.
      The booking record should have the correct `guest_user_id` (the ID of the authenticated guest) and `created_by_user_id` (the ID of the authenticated user who created the booking).

  Rejections:
  - Invalid input → 400.
  - Broken business rule → [status].
  - Missing resource → 404.
  - Conflict → 409.

  Response:
  - Required fields.
  - Fields that must be excluded.

  Cleanup:
  - Test data to remove/reset.
  */

  it("should create a booking as an authenticated guest", async () => {
    
    // Prepare the booking data, using the seed data shared above for valid hotelId and roomId
    const bookingData: CreateBookingInput = {
      hotelId: 11, // Valid hotelId from seed data
      roomId: 3, // Valid roomId from seed data
      guestName: "John Doe",
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };

    const response = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("bookingId");
    expect(response.body).toHaveProperty("hotelId", bookingData.hotelId);
    expect(response.body).toHaveProperty("roomId", bookingData.roomId);
    expect(response.body).toHaveProperty("guestName", bookingData.guestName);

    createdBookingIds.push(response.body.bookingId);
  });

  it("should reject unauthenticated requests", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };

    const response = await request(app)
      .post("/guests/bookings")
      .send(bookingData);
    expect(response.status).toBe(401);
  });

  it("should reject requests with invalid input", async () => {
    const invalidBookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "", // Invalid guest name
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-05",
      checkOutDate: "2024-07-01" // Invalid date range
    };

    const response = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(invalidBookingData);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "checkOutDate must be after checkInDate");
  });

  it("should reject requests for non-existent hotel or room", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 999, // Non-existent hotelId
      roomId: 999, // Non-existent roomId
      guestName: "John Doe",
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };

    const response = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Hotel not found");
  });

  it("should reject requests that violate business rules (overlapping bookings)", async () => {
    // First, create a valid booking to set up the overlapping scenario
    const initialBookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };

    const initialResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(initialBookingData);
    expect(initialResponse.status).toBe(201);
    createdBookingIds.push(initialResponse.body.bookingId);

    const overlappingBookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-03",
      checkOutDate: "2024-07-07"
    };

    const overlappingResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(overlappingBookingData);
    expect(overlappingResponse.status).toBe(400);
    expect(overlappingResponse.body).toHaveProperty("message", "Overlapping booking exists");
  });

  it("should reject requests that result in zero nights or zero total price", async () => {
    const zeroNightsBookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-01" // Same day, zero nights
    };

    const response = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(zeroNightsBookingData);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", /*Controller's response comes first*/ "checkOutDate must be after checkInDate");
  });
});

describe("View booking history as an authenticated guest", () => {
  
  /*
  [HTTP METHOD] [PATH]

  Access:
  - Who can access? -> Authenticated guests only.
  - Unauthenticated → 401 Unauthorized.
  - Unauthorized role/ownership → 403 Forbidden.

  Success:
  - Valid request → 200 OK.
  - Expected response body: an array of booking objects, each containing the required fields as specified above.
  - Expected database effect: No changes to the database; this is a read-only operation.

  Rejections:
  - Invalid input → not applicable for this endpoint.
  - Broken business rule → [status].
  - Missing resource → not applicable for this endpoint.
  - Conflict → not applicable for this endpoint.

  Response:
  - Required fields.
  - Fields that must be excluded.

  Cleanup:
  - Test data to remove/reset.
  */
  
  it("should return booking history for the authenticated guest", async () => {
    const bookingData1: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };

    const bookingData2: CreateBookingInput = {
      hotelId: 11,
      roomId: 4,
      guestName: "John Doe",
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-10",
      checkOutDate: "2024-07-15"
    };

    const response = await request(app)
      .get("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  it("should reject unauthenticated requests", async () => {
    const response = await request(app)
      .get("/guests/bookings");
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Authentication token missing");
  });

  it("should reject requests from users with unauthorized roles", async () => {
    /* Log in as a staff user and obtain a token
      Staff:
      "email": "staff@hotel.local",
      "password": "Staff123!"
    */
    const staffLoginResponse = await request(app)
      .post("/auth/login")
      .send({
        email: "staff@hotel.local",
        password: "Staff123!"
      });
    expect(staffLoginResponse.status).toBe(200);
    const staffToken = staffLoginResponse.body.token;

    const response = await request(app)
      .get("/guests/bookings")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Forbidden: You do not have access to this resource");
  });

  it("should return an empty array if the guest has no bookings", async () => {
    // Since the guest user created in beforeAll has no bookings, we can use that user to test this case.
    const response = await request(app)
      .get("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });
});

describe("View a specific booking as an authenticated guest", () => {
  it("should return the booking details for the authenticated guest", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      guestUserId: 1,
      createdByUserId: 1,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const response = await request(app)
      .get(`/guests/bookings/${createResponse.body.bookingId}`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("hotelId", bookingData.hotelId);
    expect(response.body).toHaveProperty("roomId", bookingData.roomId);
    expect(response.body).toHaveProperty("guestName", bookingData.guestName);
    expect(response.body).toHaveProperty("guestUserId", bookingData.guestUserId);
    expect(response.body).toHaveProperty("createdByUserId", bookingData.createdByUserId);
    expect(response.body).toHaveProperty("checkInDate", bookingData.checkInDate);
    expect(response.body).toHaveProperty("checkOutDate", bookingData.checkOutDate);
  });

  it("should return 401 for unauthenticated requests", async () => {
    const response = await request(app)
      .get("/guests/bookings/1");
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Authentication token missing");
  });

  it("should return 403 for requests from users with unauthorized roles", async () => {
    const staffLoginResponse = await request(app)
      .post("/auth/login")
      .send({
        email: "staff@hotel.local",
        password: "Staff123!"
      });
    expect(staffLoginResponse.status).toBe(200);
    const staffToken = staffLoginResponse.body.token;

    const response = await request(app)
      .get("/guests/bookings/1")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Forbidden: You do not have access to this resource");
  });

  it("should return 404 for a non-existent booking", async () => {
    const response = await request(app)
      .get("/guests/bookings/9999")
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Booking not found");
  });
});

describe("Update a booking as an authenticated guest", () => {
  /*
  [HTTP METHOD] [PATH]: PATCH /guests/bookings/:bookingId

  Access:
  - Who can access? -> Authenticated guests only.
  - Unauthenticated → 401 Unauthorized.
  - Unauthorized role/ownership → 403 Forbidden.

  Success:
  - Valid request → 200 OK.
  - Expected response body: the updated booking object, containing the required fields as specified above.
  - Expected database effect: The booking record is updated in the database with the new values provided in the request.
    
  Rejections:
  - Invalid input → 400 (e.g., invalid bookingId, invalid fields in the request body).
  - Broken business rule → 400 (e.g., overlapping booking, checkOutDate before checkInDate, nights <= 0, totalPrice <= 0).
  - Missing resource → 404 (e.g., booking not found, hotel not found, room not found).
  - Conflict → 409.

  Response:
  - Required fields.
  - Fields that must be excluded.

  Cleanup:
  - Test data to remove/reset.
  
  */