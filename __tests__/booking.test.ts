import request from "supertest";
import { app } from "../src/app";
import pool from "../src/database/db";

const createdBookingIds: number[] = [];
let authToken = ""; // Stores the JWT once so every protected request in this file can reuse it.

function authHeaders() { // Builds the Authorization header required by the protected booking routes.
  if (!authToken) {
    throw new Error("Authentication token not initialized for tests"); // Fails fast if a test tries to call a protected route before login happened.
  }

  return {
    Authorization: `Bearer ${authToken}`, // This is the exact header format the auth middleware expects.
  };
}

beforeAll(async () => { // Logs in once before the test suite starts.
  const loginResponse = await request(app)
    .post("/login") // Uses the real login route instead of bypassing auth.
    .send({
      email: "admin@hotel.local", // Seeded admin account from seed.sql.
      password: "Admin123!", // Plain password that matches the seeded password hash.
    });

  expect(loginResponse.status).toBe(200); // Confirms login succeeded before any booking tests run.
  expect(loginResponse.body.token).toEqual(expect.any(String)); // Confirms the API returned a usable JWT.

  authToken = loginResponse.body.token; // Saves the token for all the requests below.
});

describe("GET /bookings/:id", () => {
  it("returns 404 when booking does not exist", async () => {
    const response = await request(app)
      .get("/bookings/999")
      .set(authHeaders()); // Adds the bearer token so this test reaches booking logic instead of stopping at 401.

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Booking not found"
    });
  });
});

describe("POST /bookings", () => {
  it("returns 400 when required fields are missing", async () => {
    const response = await request(app)
      .post("/bookings")
      .set(authHeaders()) // Authenticates the request because POST /bookings is protected.
      .send({
        hotelId: 1,
        roomId: 1
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "Missing required fields"
    });
  });

  it("returns 404 when hotel does not exist", async () => {
    const response = await request(app)
      .post("/bookings")
      .set(authHeaders()) // Without this header, the route would return 401 before checking the hotel id.
      .send({
        hotelId: 999,
        roomId: 1,
        guestName: "Invalid Hotel Test",
        checkInDate: "2026-10-01",
        checkOutDate: "2026-10-03"
        });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
        success: false,
        message: "Hotel not found"
    });
    });
    
  it("returns 404 when room does not exist in the specified hotel", async () => {
    const response = await request(app)
      .post("/bookings")
      .set(authHeaders()) // Lets the test exercise room validation instead of auth validation.
      .send({
        hotelId: 11,
        roomId: 999,
        guestName: "Invalid Room Test",
        checkInDate: "2026-10-10",
        checkOutDate: "2026-10-12"
      });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Room not found in the specified hotel"
    });
  });
  
  it("returns 400 when checkOutDate is before checkInDate", async () => {
    const response = await request(app)
      .post("/bookings")
      .set(authHeaders()) // Lets the API reach the date check for this scenario.
      .send({
        hotelId: 10,
        roomId: 1,
        guestName: "Invalid Date Test",
        checkInDate: "2026-10-10",
        checkOutDate: "2026-10-05"
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      success: false,
      message: "checkOutDate must be after checkInDate"
    });
  });

  it("returns 400 when booking dates overlap an existing booking", async () => {
  const response = await request(app)
    .post("/bookings")
    .set(authHeaders()) // Lets the service evaluate booking overlap rules.
    .send({
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
  const response = await request(app)
    .post("/bookings")
    .set(authHeaders()) // Auth is required even for the happy-path create case.
    .send({
      hotelId: 11,
      roomId: 4,
      guestName: "Success Test",
      checkInDate: "2026-12-12",
      checkOutDate: "2026-12-15",
    });

  expect(response.status).toBe(201);

  createdBookingIds.push(response.body.booking.id);

  expect(response.body.message).toBe(
    "Booking created successfully"
  );

  expect(response.body.booking).toMatchObject({
    hotel_id: 11,
    room_id: 4,
    guest_name: "Success Test",
    nights: 3,
    total_price: 510,
  });
  });
});



describe("PATCH /bookings/:id", () => {
  it("returns 404 when booking does not exist", async () => {
    const response = await request(app)
      .patch("/bookings/999")
      .set(authHeaders()) // Allows the PATCH request to reach the missing-booking check.
      .send({
        guestName: "Updated Name",
      });

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Booking not found",
    });
  });

  it("updates a booking when request data is valid", async () => {
    const createResponse = await request(app)
      .post("/bookings")
      .set(authHeaders()) // Creates the initial booking as an authenticated user.
      .send({
        hotelId: 11,
        roomId: 4,
        guestName: "Patch Test",
        checkInDate: "2027-02-01",
        checkOutDate: "2027-02-04",
      });

    expect(createResponse.status).toBe(201);

    const bookingId = createResponse.body.booking.id;
    createdBookingIds.push(bookingId);

    const patchResponse = await request(app)
      .patch(`/bookings/${bookingId}`)
      .set(authHeaders()) // Authenticates the update request too.
      .send({
        guestName: "Patch Test Updated",
        checkInDate: "2027-02-05",
        checkOutDate: "2027-02-08",
      });

    expect(patchResponse.status).toBe(200);

    expect(patchResponse.body.message).toBe(
      "Booking updated successfully"
    );

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
    const createResponse = await request(app)
      .post("/bookings")
      .set(authHeaders()) // Needed so the setup booking is created successfully.
      .send({
        hotelId: 11,
        roomId: 4,
        guestName: "Invalid Patch Test",
        checkInDate: "2027-03-01",
        checkOutDate: "2027-03-04",
      });

    const bookingId = createResponse.body.booking.id;
    createdBookingIds.push(bookingId);

    const patchResponse = await request(app)
      .patch(`/bookings/${bookingId}`)
      .set(authHeaders()) // Needed so the invalid-date validation is what gets tested.
      .send({
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
    const createResponseA = await request(app).
      post("/bookings")
      .set(authHeaders()) // Authenticates creation of the first booking in the overlap test.
      .send({
        hotelId: 11,
        roomId: 4,
        guestName: "Overlap Patch Test",
        checkInDate: "2027-04-01",
        checkOutDate: "2027-04-05",
      });

      const bookingIdA = createResponseA.body.booking.id;
      createdBookingIds.push(bookingIdA);

    const createResponseB = await request(app)
      .post("/bookings")
      .set(authHeaders()) // Authenticates creation of the second booking in the overlap test.
      .send({
        hotelId: 11,
        roomId: 4,
        guestName: "Overlap Patch Test 2",
        checkInDate: "2027-04-10",
        checkOutDate: "2027-04-15",
      });

      const bookingIdB = createResponseB.body.booking.id;
      createdBookingIds.push(bookingIdB);

    const patchResponse = await request(app)
      .patch(`/bookings/${bookingIdB}`)
      .set(authHeaders()) // Authenticates the PATCH so overlap validation actually runs.
      .send({
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


describe("DELETE /bookings/:id", () => {
  it("returns 404 when booking does not exist", async () => {
    const response = await request(app)
      .delete("/bookings/999")
      .set(authHeaders()); // DELETE is admin-only, so the test must include the token.

    expect(response.status).toBe(404);

    expect(response.body).toEqual(
      {
        success: false,
        message: "Booking not found"
      }
    );
  });

  it("deletes a booking when it exists", async () => {
    const createResponse = await request(app)
      .post("/bookings")
      .set(authHeaders()) // Authenticates creation of the booking that will be deleted.
      .send({
        hotelId: 11,
        roomId: 4,
        guestName: "Delete Test",
        checkInDate: "2027-05-01",
        checkOutDate: "2027-05-04",
      });

    const bookingId = createResponse.body.booking.id;

    const deleteResponse = await request(app)
      .delete(`/bookings/${bookingId}`)
      .set(authHeaders()); // Authenticates the delete request itself.

    const checkResponse = await request(app)
      .get(`/bookings/${bookingId}`)
      .set(authHeaders()); // Authenticates the follow-up read that confirms deletion.
    expect(checkResponse.status).toBe(404);
    expect(checkResponse.body).toEqual({
      success: false,
      message: "Booking not found"
    });

    expect(deleteResponse.status).toBe(200);

    expect(deleteResponse.body.message).toBe(
      "Booking deleted successfully"
    );
    expect(deleteResponse.body.booking.id).toBe(bookingId);
  });
});


afterEach(async () => {
  for (const bookingId of createdBookingIds) {
    await pool.query(
      "DELETE FROM bookings WHERE id = $1",
      [bookingId]
    );
  }

  createdBookingIds.length = 0;
});

afterAll(async () => {
  await pool.end();
});

