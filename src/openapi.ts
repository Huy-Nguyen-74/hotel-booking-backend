export const openApiDocument = {
  openapi: "3.0.3",

  info: {
    title: "Hotel Booking Backend API",
    version: "1.0.0",
  },

  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Hotels" },
    { name: "Rooms" },
    { name: "Bookings" },
    { name: "Guests" },
    { name: "Payments" },
  ],

  paths: {
    "/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": {
            description: "Invalid email or password",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Error" } },
            },
          },
          "403": {
            description: "User is inactive",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Error" } },
            },
          },
        },
      },
    },

    "/request-password-reset": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        description:
          "For valid requests, returns 200 regardless of whether the email exists, to avoid account enumeration. The resetToken field is only present in the test environment; in production the token would be emailed instead.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestPasswordResetRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Request processed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RequestPasswordResetResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },

    "/confirm-password-reset": {
      post: {
        tags: ["Auth"],
        summary: "Confirm a password reset using a reset token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ConfirmPasswordResetRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Password reset successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },

    "/hotels": {
      get: {
        tags: ["Hotels"],
        summary: "Get hotels",
        description: "Public endpoint. Returns all hotels when no filters are provided.",
        parameters: [
          {
            in: "query",
            name: "hotelId",
            required: false,
            schema: { type: "integer", minimum: 1 },
          },
          {
            in: "query",
            name: "name",
            required: false,
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "city",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Hotels retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Hotel" },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },

      post: {
        tags: ["Hotels"],
        summary: "Create a hotel",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateHotelRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Hotel created successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Hotel" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/hotels/{hotelId}": {
      patch: {
        tags: ["Hotels"],
        summary: "Update hotel",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin.",
        parameters: [
          {
            in: "path",
            name: "hotelId",
            required: true,
            schema: { type: "integer", minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateHotelRequest" },
              example: { name: "Osaka Bay Grand Hotel" },
            },
          },
        },
        responses: {
          "200": {
            description: "Hotel updated successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Hotel" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/rooms": {
      get: {
        tags: ["Rooms"],
        summary: "Get rooms",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin or staff.",
        parameters: [
          { in: "query", name: "hotelId", required: false, schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "roomId", required: false, schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "type", required: false, schema: { type: "string" } },
          { in: "query", name: "price", required: false, schema: { type: "number" } },
        ],
        responses: {
          "200": {
            description: "Rooms retrieved successfully",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Room" } },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },

      post: {
        tags: ["Rooms"],
        summary: "Create a room",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateRoomRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Room created successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Room" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": {
            description: "hotelId does not reference an existing hotel",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Error" } },
            },
          },
        },
      },
    },

    "/available-rooms": {
      get: {
        tags: ["Rooms"],
        summary: "Search available rooms",
        description: "Public endpoint. Optionally filter by hotel, type, price range, and date range.",
        parameters: [
          { in: "query", name: "hotelId", required: false, schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "type", required: false, schema: { type: "string" } },
          { in: "query", name: "minPrice", required: false, schema: { type: "number" } },
          { in: "query", name: "maxPrice", required: false, schema: { type: "number" } },
          { in: "query", name: "checkInDate", required: false, schema: { type: "string", format: "date" } },
          { in: "query", name: "checkOutDate", required: false, schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": {
            description: "Available rooms retrieved successfully",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Room" } },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },

    "/rooms/{roomId}": {
      patch: {
        tags: ["Rooms"],
        summary: "Update room",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin.",
        parameters: [
          { in: "path", name: "roomId", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateRoomRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Room updated successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Room" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "Get bookings",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin or staff.",
        parameters: [
          { in: "query", name: "hotelId", required: false, schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "roomId", required: false, schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "guestName", required: false, schema: { type: "string" } },
          { in: "query", name: "checkInDate", required: false, schema: { type: "string", format: "date" } },
          { in: "query", name: "checkOutDate", required: false, schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": {
            description: "Bookings retrieved successfully",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Booking" } },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },

      post: {
        tags: ["Bookings"],
        summary: "Create a booking",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin or staff. Guests create bookings via POST /guests/bookings instead.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBookingRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Booking created successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/BookingActionResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": {
            description: "Guest user, hotel, or room not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },

    "/bookings/{bookingId}": {
      get: {
        tags: ["Bookings"],
        summary: "Get a booking by ID",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin or staff.",
        parameters: [
          { in: "path", name: "bookingId", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": {
            description: "Booking retrieved successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Booking" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },

      patch: {
        tags: ["Bookings"],
        summary: "Update a booking",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin or staff.",
        parameters: [
          { in: "path", name: "bookingId", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateBookingRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Booking updated successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/BookingActionResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },

      delete: {
        tags: ["Bookings"],
        summary: "Delete a booking",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin.",
        parameters: [
          { in: "path", name: "bookingId", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": {
            description: "Booking deleted successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/BookingActionResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/guests": {
      post: {
        tags: ["Guests"],
        summary: "Register a new guest account",
        description: "Public endpoint.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateGuestRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Guest account created successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/User" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },

    "/guests/me": {
      get: {
        tags: ["Guests"],
        summary: "Get the authenticated guest's own profile",
        security: [{ BearerAuth: [] }],
        description: "Requires role: guest.",
        responses: {
          "200": {
            description: "Guest profile retrieved successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/User" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },

      patch: {
        tags: ["Guests"],
        summary: "Update the authenticated guest's own profile",
        security: [{ BearerAuth: [] }],
        description: "Requires role: guest.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateSelfInfoRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Guest profile updated successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UserActionResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/guests/bookings": {
      get: {
        tags: ["Guests"],
        summary: "Get the authenticated guest's booking history",
        security: [{ BearerAuth: [] }],
        description: "Requires role: guest.",
        responses: {
          "200": {
            description: "Booking history retrieved successfully",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Booking" } },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },

      post: {
        tags: ["Guests"],
        summary: "Create a booking as the authenticated guest",
        security: [{ BearerAuth: [] }],
        description: "Requires role: guest. guestUserId is derived from the authenticated token, not the request body.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GuestCreateBookingRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Booking created successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Booking" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": {
            description: "Hotel or room not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },

    "/guests/bookings/{bookingId}": {
      get: {
        tags: ["Guests"],
        summary: "Get one of the authenticated guest's own bookings",
        security: [{ BearerAuth: [] }],
        description: "Requires role: guest.",
        parameters: [
          { in: "path", name: "bookingId", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": {
            description: "Booking retrieved successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Booking" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": {
            description: "Booking not found, or belongs to a different guest",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },

      patch: {
        tags: ["Guests"],
        summary: "Update one of the authenticated guest's own bookings",
        security: [{ BearerAuth: [] }],
        description: "Requires role: guest.",
        parameters: [
          { in: "path", name: "bookingId", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GuestUpdateBookingRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Booking updated successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Booking" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": {
            description: "Booking not found, or belongs to a different guest",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },

    "/guests/bookings/{bookingId}/cancel": {
      post: {
        tags: ["Guests"],
        summary: "Cancel one of the authenticated guest's own bookings",
        security: [{ BearerAuth: [] }],
        description: "Requires role: guest.",
        parameters: [
          { in: "path", name: "bookingId", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": {
            description: "Booking cancelled successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/BookingActionResponse" } },
            },
          },
          "400": {
            description: "Invalid bookingId, booking already cancelled, or past check-in date",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": {
            description: "Booking not found, or belongs to a different guest",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },

    "/users": {
      post: {
        tags: ["Users"],
        summary: "Create a staff user",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin. Only staff users can be created through this endpoint.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/User" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },

      get: {
        tags: ["Users"],
        summary: "Get users",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin.",
        parameters: [
          { in: "query", name: "id", required: false, schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "email", required: false, schema: { type: "string", format: "email" } },
        ],
        responses: {
          "200": {
            description: "Users retrieved successfully",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/User" } },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get the authenticated user's own profile",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin or staff.",
        responses: {
          "200": {
            description: "User profile retrieved successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/User" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },

      patch: {
        tags: ["Users"],
        summary: "Update the authenticated user's own profile",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin or staff.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateSelfInfoRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "User profile updated successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UserActionResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/users/{id}/deactivate": {
      patch: {
        tags: ["Users"],
        summary: "Deactivate a user",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin.",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": {
            description: "User deactivated successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UserActionResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": {
            description: "User not found, or already inactive",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },

    "/users/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Update a user's info",
        security: [{ BearerAuth: [] }],
        description: "Requires role: admin.",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserInfoRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "User updated successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/User" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },


    "/guests/bookings/{bookingId}/payments": {
      post: {
        tags: ["Payments"],
        summary: "Create or continue a payment for a guest's booking",
        security: [{ BearerAuth: [] }],
        description:
          "Requires role: guest. Creates a new Stripe PaymentIntent for the booking's total price, or reuses the existing PaymentIntent if a payment for this booking is still pending. Returns 200 when reusing a pending PaymentIntent, or 201 when a new one is created.",
        parameters: [
          { in: "path", name: "bookingId", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": {
            description: "Existing pending payment reused successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PaymentIntentResponse" } },
            },
          },
          "201": {
            description: "Payment created successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PaymentIntentResponse" } },
            },
          },
          "400": {
            description: "Invalid bookingId, booking is cancelled, or booking has already been paid for",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": {
            description: "Booking not found, or belongs to a different guest",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },

    "/webhooks/stripe": {
      post: {
        tags: ["Payments"],
        summary: "Receive Stripe webhook events",
        description:
          "Public endpoint (no bearer auth). Verifies the Stripe-Signature header against the raw request body using STRIPE_WEBHOOK_SECRET. Handles payment_intent.succeeded and payment_intent.payment_failed events by updating the matching payment's status; other event types are acknowledged without action.",
        parameters: [
          {
            in: "header",
            name: "Stripe-Signature",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
              description: "Raw Stripe event payload, sent as the unparsed request body so the signature can be verified.",
            },
          },
        },
        responses: {
          "200": {
            description: "Webhook event received and processed",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/StripeWebhookResponse" } },
            },
          },
          "400": {
            description: "Missing or invalid Stripe-Signature header",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          "404": {
            description: "No payment record found for the PaymentIntent referenced by the event",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    responses: {
      BadRequest: {
        description: "Validation error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Unauthorized: {
        description: "Authentication token is missing or malformed",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Forbidden: {
        description: "Authentication token is invalid, or the authenticated role is not allowed to access this resource",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Conflict: {
        description: "Request conflicts with the current state of the resource",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },

    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
        required: ["success", "message"],
      },

      Hotel: {
        type: "object",
        properties: {
          hotelId: { type: "integer", minimum: 1 },
          name: { type: "string" },
          city: { type: "string" },
        },
        required: ["hotelId", "name", "city"],
      },

      Room: {
        type: "object",
        properties: {
          roomId: { type: "integer", minimum: 1 },
          hotelId: { type: "integer", minimum: 1 },
          type: { type: "string" },
          price: { type: "number" },
        },
        required: ["roomId", "hotelId", "type", "price"],
      },

      Booking: {
        type: "object",
        properties: {
          bookingId: { type: "integer", minimum: 1 },
          hotelId: { type: "integer", minimum: 1 },
          roomId: { type: "integer", minimum: 1 },
          guestName: { type: "string" },
          guestUserId: { type: "integer", minimum: 1, nullable: true },
          createdByUserId: { type: "integer", minimum: 1 },
          checkInDate: { type: "string", format: "date" },
          checkOutDate: { type: "string", format: "date" },
          nights: { type: "integer" },
          totalPrice: { type: "number" },
          status: { type: "string", enum: ["confirmed", "cancelled"] },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
        },
        required: [
          "bookingId",
          "hotelId",
          "roomId",
          "guestName",
          "createdByUserId",
          "checkInDate",
          "checkOutDate",
          "nights",
          "totalPrice",
          "status",
        ],
      },

      User: {
        type: "object",
        properties: {
          userId: { type: "integer", minimum: 1 },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "staff", "guest"] },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["userId", "firstName", "lastName", "email", "role", "isActive", "createdAt", "updatedAt"],
      },

      AuthUser: {
        type: "object",
        description: "Slimmer user projection returned only from /login.",
        properties: {
          userId: { type: "integer", minimum: 1 },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "staff", "guest"] },
        },
        required: ["userId", "firstName", "lastName", "email", "role"],
      },

      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
        required: ["email", "password"],
      },

      LoginResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Login successful" },
          user: { $ref: "#/components/schemas/AuthUser" },
          token: { type: "string" },
        },
        required: ["message", "user", "token"],
      },

      RequestPasswordResetRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
        },
        required: ["email"],
      },

      RequestPasswordResetResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          resetToken: { type: "string", description: "Only present in the test environment." },
        },
        required: ["success", "message"],
      },

      ConfirmPasswordResetRequest: {
        type: "object",
        properties: {
          token: { type: "string" },
          newPassword: { type: "string", minLength: 15 },
        },
        required: ["token", "newPassword"],
      },

      MessageResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
        },
        required: ["success", "message"],
      },

      CreateHotelRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          city: { type: "string" },
        },
        required: ["name", "city"],
      },

      UpdateHotelRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          city: { type: "string" },
        },
        minProperties: 1,
        additionalProperties: false,
      },

      CreateRoomRequest: {
        type: "object",
        properties: {
          hotelId: { type: "integer", minimum: 1 },
          type: { type: "string" },
          price: { type: "number" },
        },
        required: ["hotelId", "type", "price"],
      },

      UpdateRoomRequest: {
        type: "object",
        properties: {
          type: { type: "string" },
          price: { type: "number" },
        },
        minProperties: 1,
        additionalProperties: false,
      },

      CreateBookingRequest: {
        type: "object",
        properties: {
          hotelId: { type: "integer", minimum: 1 },
          roomId: { type: "integer", minimum: 1 },
          guestName: { type: "string" },
          guestUserId: { type: "integer", minimum: 1, description: "Optional link to an existing guest user account." },
          checkInDate: { type: "string", format: "date" },
          checkOutDate: { type: "string", format: "date" },
        },
        required: ["hotelId", "roomId", "guestName", "checkInDate", "checkOutDate"],
      },

      UpdateBookingRequest: {
        type: "object",
        properties: {
          hotelId: { type: "integer", minimum: 1 },
          roomId: { type: "integer", minimum: 1 },
          guestName: { type: "string" },
          checkInDate: { type: "string", format: "date" },
          checkOutDate: { type: "string", format: "date" },
        },
        minProperties: 1,
        additionalProperties: false,
      },

      GuestCreateBookingRequest: {
        type: "object",
        properties: {
          hotelId: { type: "integer", minimum: 1 },
          roomId: { type: "integer", minimum: 1 },
          guestName: { type: "string" },
          checkInDate: { type: "string", format: "date" },
          checkOutDate: { type: "string", format: "date" },
        },
        required: ["hotelId", "roomId", "guestName", "checkInDate", "checkOutDate"],
      },

      GuestUpdateBookingRequest: {
        type: "object",
        properties: {
          guestName: { type: "string" },
          checkInDate: { type: "string", format: "date" },
          checkOutDate: { type: "string", format: "date" },
        },
        minProperties: 1,
        additionalProperties: false,
      },

      BookingActionResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          booking: { $ref: "#/components/schemas/Booking" },
        },
        required: ["message", "booking"],
      },

      CreateUserRequest: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 15 },
          role: { type: "string", enum: ["staff"] },
        },
        required: ["firstName", "lastName", "email", "password", "role"],
      },

      CreateGuestRequest: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 15 },
        },
        required: ["firstName", "lastName", "email", "password"],
      },

      UpdateSelfInfoRequest: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          password: { type: "string", minLength: 15 },
        },
        minProperties: 1,
        additionalProperties: false,
      },

      UpdateUserInfoRequest: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          isActive: { type: "boolean" },
        },
        minProperties: 1,
        additionalProperties: false,
      },

      UserActionResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          body: { $ref: "#/components/schemas/User" },
        },
        required: ["success", "message", "body"],
      },

      Payment: {
        type: "object",
        properties: {
          paymentId: { type: "integer", minimum: 1 },
          bookingId: { type: "integer", minimum: 1 },
          amount: { type: "number" },
          currency: { type: "string" },
          status: { type: "string", enum: ["pending", "succeeded", "failed"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["paymentId", "bookingId", "amount", "currency", "status", "createdAt", "updatedAt"],
      },

      PaymentIntentResponse: {
        type: "object",
        properties: {
          payment: { $ref: "#/components/schemas/Payment" },
          clientSecret: {
            type: "string",
            nullable: false,
            description: "Stripe PaymentIntent client secret used by the frontend to confirm the payment.",
          },
        },
        required: ["payment", "clientSecret"],
      },

      StripeWebhookResponse: {
        type: "object",
        properties: {
          received: { type: "boolean", example: true },
        },
        required: ["received"],
      },
    },
  },
};