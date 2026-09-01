import { afterAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app";
import pool from "../../src/database/db";

import { CreateBookingInput } from "../../src/types/booking";
import { stripe } from "../../src/integrations/stripe";

jest.mock("../../src/integrations/stripe", () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: "pi_test_123",
        status: "requires_payment_method",
        client_secret: "pi_test_secret",
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: "pi_test_123",
        status: "requires_payment_method",
        client_secret: "pi_test_secret",
      }),
    },

    webhooks: {
      constructEvent: jest.fn()
    },
  },
}));

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

/*
Aug 24, 2026: adding payment tests to this suite (booking creation now involves a payment step/route).
*/

const createdBookingIds: number[] = [];

afterEach(async () => {
    // Clean up created payments after each test (payments added around Aug 20, 2026. That section is written in the test suite below, line 1095)
    for (const bookingId of createdBookingIds) {
        await pool.query("DELETE FROM payments WHERE booking_id = $1", [bookingId]);
    }

    // Clean up created bookings after each test
    for (const bookingId of createdBookingIds) {
        await pool.query("DELETE FROM bookings WHERE id = $1", [bookingId]);
    }
    createdBookingIds.length = 0; // Clear the array

    // Clean up jest mocks for stripe after each test to avoid interference between tests
    jest.restoreAllMocks();
});

// First, create a guest user and obtain a JWT token for authentication.
// This will be used across all tests in this suite to simulate an authenticated guest user.
// After all tests, we will clean up by deleting the created guest user from the database.

let guestToken: string;
let guestUserId: number;

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
    expect(guestResponse.body).toHaveProperty("userId");
    expect(guestResponse.body).toHaveProperty("firstName", "John");
    expect(guestResponse.body).toHaveProperty("lastName", "Doe");
    expect(guestResponse.body).toHaveProperty("email", "john.doe@example.com");

    guestUserId = guestResponse.body.userId;

    // POST /guests doesn't return a token, so log in separately to get one.
    const loginResponse = await request(app)
      .post("/login")
      .send({
        email: "john.doe@example.com",
        password: "password123456789"
      });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("token");

    guestToken = loginResponse.body.token;
});

// Clean up guest user DB after all tests, then close the pool
afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", ["john.doe@example.com"]);
    await pool.end();
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
      createdByUserId: guestUserId,
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
      createdByUserId: guestUserId,
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
      createdByUserId: guestUserId,
      checkInDate: "2024-07-05",
      checkOutDate: "2024-07-07"
    };

    const response = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(invalidBookingData);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "guestName must be a non-empty string");
  });

  it("should reject requests with checkOutDate before checkInDate", async () => {
    const invalidBookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-05",
      checkOutDate: "2024-07-03" // Invalid: checkOutDate before checkInDate
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
      createdByUserId: guestUserId,
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
      createdByUserId: guestUserId,
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
      createdByUserId: guestUserId,
      checkInDate: "2024-07-03",
      checkOutDate: "2024-07-07"
    };

    const overlappingResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(overlappingBookingData);
    expect(overlappingResponse.status).toBe(409);
    expect(overlappingResponse.body).toHaveProperty("message", "Room is already booked for the selected dates");
  });

  it("should reject requests that result in zero nights or zero total price", async () => {
    const zeroNightsBookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
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
      createdByUserId: guestUserId,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };

    const bookingData2: CreateBookingInput = {
      hotelId: 11,
      roomId: 4,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-10",
      checkOutDate: "2024-07-15"
    };

    const createResponse1 = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData1);
    expect(createResponse1.status).toBe(201);
    createdBookingIds.push(createResponse1.body.bookingId);

    const createResponse2 = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData2);
    expect(createResponse2.status).toBe(201);
    createdBookingIds.push(createResponse2.body.bookingId);

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
      "password": "Staff123456789!"
    */
    const staffLoginResponse = await request(app)
      .post("/login")
      .send({
        email: "staff@hotel.local",
        password: "Staff123456789!"
      });
    expect(staffLoginResponse.status).toBe(200);
    const staffToken = staffLoginResponse.body.token;

    const response = await request(app)
      .get("/guests/bookings")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Access denied");
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
      createdByUserId: guestUserId,
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
    expect(response.body).toHaveProperty("guestUserId", guestUserId);
    expect(response.body).toHaveProperty("createdByUserId", guestUserId);
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
      .post("/login")
      .send({
        email: "staff@hotel.local",
        password: "Staff123456789!"
      });
    expect(staffLoginResponse.status).toBe(200);
    const staffToken = staffLoginResponse.body.token;

    const response = await request(app)
      .get("/guests/bookings/1")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Access denied");
  });

  it("should return 404 for requests to view another guest's booking", async () => {
    // Create a booking for the authenticated guest
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    // Create a second guest user to attempt to view the first guest's booking
    const secondGuestResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe.view@hotel.local",
        password: "securepassword123456"
      });
    expect(secondGuestResponse.status).toBe(201);

    // POST /guests doesn't return a token, so log in separately to get one.
    const secondGuestLoginResponse = await request(app)
      .post("/login")
      .send({
        email: "jane.doe.view@hotel.local",
        password: "securepassword123456"
      });
    expect(secondGuestLoginResponse.status).toBe(200);
    const secondGuestToken = secondGuestLoginResponse.body.token;

    const response = await request(app)
      .get(`/guests/bookings/${createResponse.body.bookingId}`)
      .set("Authorization", `Bearer ${secondGuestToken}`);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Booking not found");

    // Clean up the second guest user
    await pool.query("DELETE FROM users WHERE email = $1", ["jane.doe.view@hotel.local"]);
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
  - Missing resource → non-existent bookingId → 404.
  - Conflict → none, but overlapping booking is a business rule violation and should return 400.

  Response:
  - Required fields.
  - Fields that must be excluded: none.

  Cleanup:
  - Test data to remove/reset: The booking created for the test should be deleted after the test is complete.
  */

  it("should update the booking for the authenticated guest", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    // Test if the same name but different dates can be updated.
    const updates = {
      guestName: "John Doe", 
      checkInDate: "2024-07-02",
      checkOutDate: "2024-07-06"
    };
    const updateResponse = await request(app)
      .patch(`/guests/bookings/${createResponse.body.bookingId}`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send(updates);
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toHaveProperty("guestName", updates.guestName);
    expect(updateResponse.body).toHaveProperty("checkInDate", updates.checkInDate);
    expect(updateResponse.body).toHaveProperty("checkOutDate", updates.checkOutDate);
  });

  it("should reject unauthenticated requests", async () => {
    const response = await request(app)
      .patch("/guests/bookings/1")
      .send({
        guestName: "John Doe",
        checkInDate: "2024-07-02",
        checkOutDate: "2024-07-06"
      });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Authentication token missing");
  });

  it("should reject requests from users with unauthorized roles", async () => {
    const staffLoginResponse = await request(app)
      .post("/login")
      .send({
        email: "staff@hotel.local",
        password: "Staff123456789!"
      });
    expect(staffLoginResponse.status).toBe(200);
    const staffToken = staffLoginResponse.body.token;

    const response = await request(app)
      .patch("/guests/bookings/1")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Access denied");
  });

  it("should return 404 for requests to update another guest's booking", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };
    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const secondGuestResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe.update@hotel.local",
        password: "securepassword123456"
      });
    expect(secondGuestResponse.status).toBe(201);

    // POST /guests doesn't return a token, so log in separately to get one.
    const secondGuestLoginResponse = await request(app)
      .post("/login")
      .send({
        email: "jane.doe.update@hotel.local",
        password: "securepassword123456"
      });
    expect(secondGuestLoginResponse.status).toBe(200);
    const secondGuestToken = secondGuestLoginResponse.body.token;

    const response = await request(app)
      .patch(`/guests/bookings/${createResponse.body.bookingId}`)
      .set("Authorization", `Bearer ${secondGuestToken}`)
      .send({ guestName: "Jane Doe Update Attempt" });
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Booking not found");

    // Clean up the second guest user
    await pool.query("DELETE FROM users WHERE email = $1", ["jane.doe.update@hotel.local"]);
  });

  // Business error cases: overlapping booking, checkOutDate before checkInDate, nights <= 0, totalPrice <= 0
  it("should reject updates that violate business rules (overlapping bookings)", async () => {
    const bookingData1: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };
    const bookingData2: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-10",
      checkOutDate: "2024-07-15"
    };

    const createResponse1 = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData1);
    expect(createResponse1.status).toBe(201);
    createdBookingIds.push(createResponse1.body.bookingId);

    const createResponse2 = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData2);
    expect(createResponse2.status).toBe(201);
    createdBookingIds.push(createResponse2.body.bookingId);

    const overlappingUpdates = {
      checkInDate: "2024-07-03",
      checkOutDate: "2024-07-12"
    };
    const overlapResponse = await request(app)
      .patch(`/guests/bookings/${createResponse2.body.bookingId}`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send(overlappingUpdates);
    expect(overlapResponse.status).toBe(409);
    expect(overlapResponse.body).toHaveProperty("message", "Room is already booked for the selected dates");
  });

  it("should reject updates where checkOutDate is before checkInDate", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };
    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const invalidUpdates = {
      checkInDate: "2024-07-06",
      checkOutDate: "2024-07-02" // checkOutDate before checkInDate
    };
    const updateResponse = await request(app)
      .patch(`/guests/bookings/${createResponse.body.bookingId}`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send(invalidUpdates);
    expect(updateResponse.status).toBe(400);
    expect(updateResponse.body).toHaveProperty("message", "checkOutDate must be after checkInDate");
  });

  it("should reject updates that result in zero nights or zero total price", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };
    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const zeroNightsUpdates = {
      checkInDate: "2024-07-05",
      checkOutDate: "2024-07-05" // Same day, zero nights
    };
    const response = await request(app)
      .patch(`/guests/bookings/${createResponse.body.bookingId}`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send(zeroNightsUpdates);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "checkOutDate must be after checkInDate");
  });

  // Invalid input cases: invalid bookingId, invalid fields in the request body
  it("should return 400 for invalid bookingId parameter", async () => {
    const updates = {
      guestName: "John Doe",
      checkInDate: "2024-07-02",
      checkOutDate: "2024-07-06"
    };
    const response = await request(app)
      .patch("/guests/bookings/invalid-id")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(updates);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Booking ID must be a positive integer");
  });

  it("should return 400 for invalid fields in the request body", async () => {
    const bookingData: any = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-02",
      checkOutDate: "2024-07-06"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const patchResponse = await request(app)
      .patch(`/guests/bookings/${createResponse.body.bookingId}`)
      .set("Authorization", `Bearer ${guestToken}`)
      .send({
        guestName: 12345, // Invalid type, should be a string
        checkInDate: "2024-07-02",
        checkOutDate: "2024-07-06"
      });
    expect(patchResponse.status).toBe(400);
    expect(patchResponse.body).toHaveProperty("message", "guestName must be a non-empty string");
  });

  // Missing resource cases: booking not found
  it("should reject updates for a non-existent booking", async () => {
    const updates = {
      guestName: "John Doe",
      checkInDate: "2024-07-02",
      checkOutDate: "2024-07-06"
    };
    const response = await request(app)
      .patch("/guests/bookings/9999")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(updates);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Booking not found");
  });
});

describe("Cancel a booking as an authenticated guest", () => {
  /*
  [HTTP METHOD] [PATH]: POST /guests/bookings/:bookingId/cancel

  Access:
  - Who can access? -> Authenticated guests only.
  - Unauthenticated → 401 Unauthorized.
  - Unauthorized role/ownership → 403 Forbidden.

  Success:
  - Valid request → 200 OK.
  - Expected response body: the cancelled booking object, containing the required fields as specified above, with the status updated to "cancelled" as well as the cancellation timestamp.
  - Expected database effect:
      The booking record is updated in the database with the status set to "cancelled", as well as the cancellation timestamp recorded and the cancellation user ID set to the authenticated guest's user ID.
      Room becomes available for future bookings after cancellation.

  Rejections:
  - Invalid input → 400 (e.g., invalid bookingId).
  - Broken business rule → 400 (e.g., booking already cancelled, checkInDate in the past, one guest can only cancel their own booking).
  - Missing resource → non-existent bookingId → 404.
  - Conflict → none.

  Response:
  - Required fields.
  - Fields that must be excluded: none.

  Cleanup:
  - Test data to remove/reset: The booking created for the test should be deleted after the test is complete.
  */

  it("should cancel the booking for the authenticated guest", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const cancelResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body).toHaveProperty("message", "Booking cancelled successfully");
    expect(cancelResponse.body.booking).toHaveProperty("status", "cancelled");
    expect(cancelResponse.body.booking).toHaveProperty("cancelledAt");
  });

  it("should allow the same room to be booked again after cancellation", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const cancelResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(cancelResponse.status).toBe(200);

    const newBookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-06"
    };

    const newCreateResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(newBookingData);
    expect(newCreateResponse.status).toBe(201);
    expect(newCreateResponse.body).toHaveProperty("bookingId");
    expect(newCreateResponse.body).toHaveProperty("hotelId", newBookingData.hotelId);
    expect(newCreateResponse.body).toHaveProperty("roomId", newBookingData.roomId);
    expect(newCreateResponse.body).toHaveProperty("guestName", newBookingData.guestName);
    createdBookingIds.push(newCreateResponse.body.bookingId);
  });

  it("should return 401 for unauthenticated requests", async () => {
    const response = await request(app)
      .post("/guests/bookings/1/cancel");
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Authentication token missing");
  });

  it("should return 403 for requests from users with unauthorized roles", async () => {
    const staffLoginResponse = await request(app)
      .post("/login")
      .send({
        email: "staff@hotel.local",
        password: "Staff123456789!"
      });
    expect(staffLoginResponse.status).toBe(200);
    const staffToken = staffLoginResponse.body.token;

    const response = await request(app)
      .post("/guests/bookings/1/cancel")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Access denied");
  });

  it("should return 400 for invalid bookingId parameter", async () => {
    const response = await request(app)
      .post("/guests/bookings/invalid-id/cancel")
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Booking ID must be a positive integer");
  });

  it("should return 400 for cancelling a booking that is already cancelled", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const cancelResponse1 = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(cancelResponse1.status).toBe(200);

    const cancelResponse2 = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(cancelResponse2.status).toBe(400);
    expect(cancelResponse2.body).toHaveProperty("message", "Booking is already cancelled");
  });

  it("should return 400 for cancelling a booking with checkInDate in the past", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-01-01", // Past date
      checkOutDate: "2024-01-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const cancelResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(cancelResponse.status).toBe(400);
    expect(cancelResponse.body).toHaveProperty("message", "Cannot cancel a booking past its check-in date");
  });

  it("should return 404 for cancelling a booking that belongs to another guest", async () => {
    // Create a second guest user
    const secondGuestResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "Second",
        lastName: "Guest",
        email: "secondguest@hotel.local",
        password: "SecondGuest123!"
      });
    expect(secondGuestResponse.status).toBe(201);

    // POST /guests doesn't return a token, so log in separately to get one.
    const secondGuestLoginResponse = await request(app)
      .post("/login")
      .send({
        email: "secondguest@hotel.local",
        password: "SecondGuest123!"
      });
    expect(secondGuestLoginResponse.status).toBe(200);
    const secondGuestToken = secondGuestLoginResponse.body.token;

    const otherBookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "Second Guest",
      createdByUserId: secondGuestResponse.body.userId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };

    const otherCreateResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${secondGuestToken}`)
      .send(otherBookingData);
    expect(otherCreateResponse.status).toBe(201);

    const response = await request(app)
      .post(`/guests/bookings/${otherCreateResponse.body.bookingId}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Booking not found");

    await pool.query("DELETE FROM bookings WHERE id = $1", [otherCreateResponse.body.bookingId]);
    await pool.query("DELETE FROM users WHERE email = $1", ["secondguest@hotel.local"]);
  });

  it("should return 404 for cancelling a non-existent booking", async () => {
    const response = await request(app)
      .post("/guests/bookings/9999/cancel")
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Booking not found");
  });
});

describe("Process payment for a booking as an authenticated guest", () => {
  /*
  POST /guests/bookings/:bookingId/payments

  Access:
  - Authenticated guests only.
  - Unauthenticated → 401.
  - Non-guest role → 403.
  - Another guest's booking → 404.

  Success:
  - Valid request → 201.
  - Response contains:
      payment
      clientSecret
  - DB effect:
      creates one payments row linked to the booking.
  - Pending payment already exists: retrieve the existing payment and return it with the clientSecret → 200.
  - Failed payment already exists: create a new payment and return it with the clientSecret → 201.
  - Simultaneous/repeated payment requests for the same booking: only one payment intent is created (but multiple requests as well as payment rows in DB may be made), and the same clientSecret should be returned for all requests.
  
  Rejections:
  - Invalid bookingId → 400.
  - Cancelled booking → 400.
  - Successful payment already exists → 400.
  - Non-existent/other guest's booking → 404.

  Cleanup:
  - Delete payment row first.
  - Then delete booking/test data.
*/

it("should process payment for the authenticated guest's booking", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };
    
    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const paymentResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/payments`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body).toHaveProperty("payment");
    expect(paymentResponse.body).toHaveProperty("clientSecret");

    const paymentRow = await pool.query("SELECT * FROM payments WHERE booking_id = $1", [createResponse.body.bookingId]);
    expect(paymentRow.rows.length).toBe(1);
    expect(paymentRow.rows[0]).toHaveProperty("booking_id", createResponse.body.bookingId);

    // Cleanup: delete the payment row first
    await pool.query("DELETE FROM payments WHERE booking_id = $1", [createResponse.body.bookingId]);
    // Cleanup: delete the booking row (already in createdBookingIds, will be cleaned up in afterAll)
  });

  it("should process payment for a booking that already has a pending payment", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };
    
    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    // Create a successful payment for the booking and then change its status to "pending" to simulate a pending payment scenario.
    const paymentResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/payments`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(paymentResponse.status).toBe(201);

    // Update the payment status to "pending"
    await pool.query("UPDATE payments SET status = $1 WHERE booking_id = $2", ["pending", createResponse.body.bookingId]);

    const secondPaymentResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/payments`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(secondPaymentResponse.status).toBe(200);
    expect(secondPaymentResponse.body).toHaveProperty("payment");
    expect(secondPaymentResponse.body).toHaveProperty("clientSecret");

    // Cleanup: delete the payment row first
    await pool.query("DELETE FROM payments WHERE booking_id = $1", [createResponse.body.bookingId]);
    // Cleanup: delete the booking row (already in createdBookingIds, will be cleaned up in afterAll)
  });

  it("should process payment for a booking that already has a failed payment", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    // Create a failed payment for the booking
    await pool.query(
      "INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, status) VALUES ($1, $2, $3, $4)",
      [createResponse.body.bookingId, `pi_test_failed_${createResponse.body.bookingId}`, 1000, "failed"]
    );

    const paymentResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/payments`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body).toHaveProperty("payment");
    expect(paymentResponse.body).toHaveProperty("clientSecret");
  });

  it("should generate the same clientSecret for simultaneous payment requests for the same booking", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const paymentRequests = [
      request(app)
        .post(`/guests/bookings/${createResponse.body.bookingId}/payments`)
        .set("Authorization", `Bearer ${guestToken}`),
      request(app)
        .post(`/guests/bookings/${createResponse.body.bookingId}/payments`)
        .set("Authorization", `Bearer ${guestToken}`)
    ];

    const responses = await Promise.all(paymentRequests);
    expect(responses[0].status).toBe(201);
    expect(responses[1].status).toBe(200);
    expect(responses[0].body.clientSecret).toBe(responses[1].body.clientSecret);
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.any(Object), { idempotencyKey: `booking-${createResponse.body.bookingId}-initial` }
    );
  });

  it("should reject payment for an unauthenticated request", async () => {
    const response = await request(app)
      .post("/guests/bookings/1/payments");
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Authentication token missing");
  });

  it("should reject payment for a wrong role (non-guest)", async () => {
    const staffLoginResponse = await request(app)
      .post("/login")
      .send({
        email: "staff@hotel.local",
        password: "Staff123456789!"
      });
    expect(staffLoginResponse.status).toBe(200);
    const staffToken = staffLoginResponse.body.token;

    const response = await request(app)
      .post("/guests/bookings/1/payments")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Access denied");
  });

  it("should reject payment for a different guest's booking", async () => {
    // Create a second guest user
    const secondGuestResponse = await request(app)
      .post("/guests")
      .send({
        firstName: "Second",
        lastName: "Guest",
        email: "second.guest@example.com",
        password: "password123456789"
      });
    expect(secondGuestResponse.status).toBe(201);
    
    // Log in as the second guest to get a token
    const secondGuestLoginResponse = await request(app)
      .post("/login")
      .send({
        email: "second.guest@example.com",
        password: "password123456789"
      });
    expect(secondGuestLoginResponse.status).toBe(200);
    const secondGuestToken = secondGuestLoginResponse.body.token;

    // Create a booking for the first guest
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2024-07-01",
      checkOutDate: "2024-07-05"
    };
    const createBookingResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createBookingResponse.status).toBe(201);
    const bookingId = createBookingResponse.body.bookingId;
    createdBookingIds.push(bookingId);

    // Attempt to process payment for the first guest's booking using the second guest's token
    const paymentResponse = await request(app)
      .post(`/guests/bookings/${bookingId}/payments`)
      .set("Authorization", `Bearer ${secondGuestToken}`);
    expect(paymentResponse.status).toBe(404);
    expect(paymentResponse.body).toHaveProperty("message", "Booking not found");

    // Cleanup: delete the second guest user
    await pool.query("DELETE FROM users WHERE email = $1", ["second.guest@example.com"]);
  });

  it("should reject payment for an invalid bookingId (string)", async () => {
    const response = await request(app)
      .post("/guests/bookings/invalid-id/payments")
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Booking ID must be a number");
  });
  
  it("should reject payment for an invalid bookingId (negative integer)", async () => {
    const response = await request(app)
      .post("/guests/bookings/-1/payments")
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Booking ID must be a positive integer");
  });

  it("should reject payment for a non-existent bookingId", async () => {
    const response = await request(app)
      .post("/guests/bookings/9999/payments")
      .set("Authorization", `Bearer ${guestToken}`);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Booking not found");
  });

  it("should reject payment for a cancelled booking", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    const cancelResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/cancel`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(cancelResponse.status).toBe(200);

    const paymentResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/payments`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(paymentResponse.status).toBe(400);
    expect(paymentResponse.body).toHaveProperty("message", "Cannot pay for a cancelled booking");
  });
  
  it("should reject payment for a booking that already has a successful payment", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 11,
      roomId: 3,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2027-07-01",
      checkOutDate: "2027-07-05"
    };
    
    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    // Create a successful payment for the booking
    await pool.query(
      "INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, status) VALUES ($1, $2, $3, $4)",
      [createResponse.body.bookingId, `pi_test_succeeded_${createResponse.body.bookingId}`, 1000, "succeeded"]
    );

    const paymentResponse = await request(app)
      .post(`/guests/bookings/${createResponse.body.bookingId}/payments`)
      .set("Authorization", `Bearer ${guestToken}`);
    expect(paymentResponse.status).toBe(400);
    expect(paymentResponse.body).toHaveProperty("message", "Booking has already been paid for");

    // Cleanup: delete the payment row first
    await pool.query("DELETE FROM payments WHERE booking_id = $1", [createResponse.body.bookingId]);
    // Cleanup: delete the booking row (already in createdBookingIds, will be cleaned up in afterAll)
  });
});



// Sep 1, 2026: add tests for webhook endpoint for Stripe payment events (e.g., payment_intent.succeeded, payment_intent.payment_failed) to update the payment status accordingly.

describe("Stripe webhook for payment events", () => {
  /*
  POST /webhooks/stripe

  Access:
  - Public endpoint, no authentication required.

  Success:
  - Valid Stripe event → 200 OK.
  - Expected response body: { received: true }.
  - Expected database effect:
      For payment_intent.succeeded:
        - Update the corresponding payment record's status to "succeeded".
      For payment_intent.payment_failed:
        - Update the corresponding payment record's status to "failed".

  Rejections:
  - Invalid Stripe signature → 400.
  - Unrecognized event type → 200 (acknowledge but do not process, as these are irrelevant events, such as payment_intent.created, payment_intent.processing, charge.updated).
  - Missing payment record for the given payment_intent_id → 404.
  */

  it("should update payment status to succeeded for payment_intent.succeeded event", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 10,
      roomId: 1,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2028-09-10",
      checkOutDate: "2028-09-15"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    // Create a payment record with status "pending"
    const paymentIntentId = `pi_test_succeeded_${createResponse.body.bookingId}`;
    await pool.query(
      "INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, status) VALUES ($1, $2, $3, $4)",
      [createResponse.body.bookingId, paymentIntentId, 1000, "pending"]
    );

    // Simulate Stripe webhook event for payment_intent.succeeded
    const stripeEvent = {
      id: "evt_test_succeeded",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: paymentIntentId
        }
      }
    } as any; // Type assertion to satisfy TypeScript, since we're mocking the event structure

    // Mock the Stripe signature verification to always return true for testing purposes
    jest.spyOn(stripe.webhooks, "constructEvent").mockReturnValue(stripeEvent);

    const response = await request(app)
      .post("/webhooks/stripe")
      .send(stripeEvent);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("received", true);

    const paymentRecord = await pool.query(
      "SELECT status FROM payments WHERE booking_id = $1",
      [createResponse.body.bookingId]
    );
    expect(paymentRecord.rows[0].status).toBe("succeeded");
  });

  it("should update payment status to failed for payment_intent.payment_failed event", async () => {
    const bookingData: CreateBookingInput = {
      hotelId: 10,
      roomId: 1,
      guestName: "John Doe",
      createdByUserId: guestUserId,
      checkInDate: "2028-09-20",
      checkOutDate: "2028-09-25"
    };

    const createResponse = await request(app)
      .post("/guests/bookings")
      .set("Authorization", `Bearer ${guestToken}`)
      .send(bookingData);
    expect(createResponse.status).toBe(201);
    createdBookingIds.push(createResponse.body.bookingId);

    // Create a payment record with status "pending"
    const paymentIntentId = `pi_test_failed_${createResponse.body.bookingId}`;
    await pool.query(
      "INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, status) VALUES ($1, $2, $3, $4)",
      [createResponse.body.bookingId, paymentIntentId, 1000, "pending"]
    );

    // Simulate Stripe webhook event for payment_intent.payment_failed
    const stripeEvent = {
      id: "evt_test_failed",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: paymentIntentId
        }
      }
    } as any; // Type assertion to satisfy TypeScript, since we're mocking the event structure

    // Mock the Stripe signature verification to always return true for testing purposes
    jest.spyOn(stripe.webhooks, "constructEvent").mockReturnValue(stripeEvent);

    const response = await request(app)
      .post("/webhooks/stripe")
      .send(stripeEvent);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("received", true);

    const paymentRecord = await pool.query(
      "SELECT status FROM payments WHERE booking_id = $1",
      [createResponse.body.bookingId]
    );
    expect(paymentRecord.rows[0].status).toBe("failed");
  });

  it("should return 400 for invalid Stripe signature", async () => {
    const stripeEvent = {
      id: "evt_test_invalid_signature",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_invalid_signature"
        }
      }
    } as any;

    // Mock the Stripe signature verification to throw an error
    jest.spyOn(stripe.webhooks, "constructEvent").mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const response = await request(app)
      .post("/webhooks/stripe")
      .send(stripeEvent);
    expect(response.status).toBe(400);
  });
});

