# API Error & Success Response Reference

Unified list of every response message returned by the API, grouped by route.
Generated to close the Guest Booking Flow backlog item (Aug 4th note: "unified list of response messages for each error/success scenario").

All errors are thrown as `new AppError(message, statusCode)` (see [src/errors/AppError.ts](../src/errors/AppError.ts)) and serialized by the centralized error middleware as `{ message }`.

---

## Authentication Routes

### POST /login (No Authentication Required)
**Controller:** `authController.login()`

**Success:** 200 — `{ message: "Login successful", user: <UserDTO>, token: <JWT> }`

**Errors:**
1. 400 — `"Request body must be a valid JSON object"` — req.body is an array
2. 400 — `"email and password are required"` — either field missing or falsy
3. 400 — `"email must be a valid email address"` — invalid email format
4. 401 — `"Invalid email or password"` — user not found OR password hash mismatch
5. 403 — `"User is inactive"` — user.is_active is false

---

### POST /request-password-reset (No Authentication Required)
**Controller:** `authController.requestPasswordReset()`

**Success:** 200 — `{ success: true, message: "If the email exists...", resetToken?: <token> }` (resetToken only in test environment)

**Errors:**
1. 400 — `"Request body must be a valid JSON object"`
2. 400 — `"email is required and must be a non-empty string"`
3. 400 — `"email must be a valid email address"`

---

### POST /confirm-password-reset (No Authentication Required)
**Controller:** `authController.confirmPasswordReset()`

**Success:** 200 — `{ success: true, message: "Password reset successful" }`

**Errors:**
1. 400 — `"Request body must be a valid JSON object"`
2. 400 — `"token is required and must be a non-empty string"`
3. 400 — `"newPassword is required and must be a non-empty string"`
4. 400 — `"newPassword must be at least 15 characters long"`
5. 400 — `"Invalid or expired password reset token"`

---

## Shared Middleware Errors

These apply to every authenticated/authorized route and are not repeated per-route below unless the exact message differs.

1. 401 — `"Authentication token missing"` — no `Authorization` header, or empty token after `"Bearer "`
2. 401 — `"Invalid authentication token format"` — header doesn't start with `"Bearer "`
3. 500 — `"JWT_SECRET is not configured"` — env var missing
4. 403 — `"Invalid authentication token"` — token verification failed
5. 403 — `"Access denied"` — authenticated role not in the route's allowed roles

---

## Booking Routes (Admin/Staff)

### GET /bookings — roles: `admin`, `staff`
**Success:** 200 — array of booking DTOs

**Errors:**
1. 400 — `"Request query must be a valid JSON object"`
2. 400 — `"hotelId must be a string"` / `"roomId must be a string"` / `"guestName must be a string"` / `"checkInDate must be a string"` / `"checkOutDate must be a string"`
3. 400 — `"hotelId must be an integer greater than 0"` / `"roomId must be an integer greater than 0"`
4. 400 — `"checkInDate must be a valid date string"` / `"checkOutDate must be a valid date string"`
5. 400 — `"checkOutDate must be after checkInDate"`

### GET /bookings/:bookingId — roles: `admin`, `staff`
**Success:** 200 — single booking DTO

**Errors:**
1. 400 — `"Request params must be a valid JSON object"`
2. 400 — `"bookingId must be an integer greater than 0"`
3. 404 — `"Booking not found"`

### POST /bookings — roles: `admin`, `staff`, `guest`
**Success:** 201 — `{ message: "Booking created successfully", booking: <BookingDTO> }`

**Errors (controller):**
1. 401 — `"User authentication required"`
2. 400 — `"Request body must be a valid JSON object"`
3. 400 — `"All fields are required"`
4. 400 — `"hotelId must be a number"` / `"roomId must be a number"`
5. 400 — `"guestName must be a non-empty string"`
6. 400 — `"guestUserId must be a number"`
7. 400 — `"checkInDate must be a valid date string"` / `"checkOutDate must be a valid date string"`
8. 400 — `"hotelId must be an integer greater than 0"` / `"roomId must be an integer greater than 0"` / `"guestUserId must be an integer greater than 0"` / `"createdByUserId must be an integer greater than 0"`

**Errors (bookingService.createBooking):**
1. 404 — `"Guest user not found or not a guest"`
2. 404 — `"Hotel not found"`
3. 404 — `"Room not found in the specified hotel"`
4. 400 — `"checkOutDate must be after checkInDate"`
5. 400 — `"Number of nights must be greater than 0"`
6. 400 — `"Total price must be greater than 0"`
7. 409 — `"Room is already booked for the selected dates"`

### PATCH /bookings/:bookingId — roles: `admin`, `staff`
**Success:** 200 — `{ message: "Booking updated successfully", booking: <BookingDTO> }`

**Errors (controller):**
1. 400 — `"Request params must be a valid JSON object"` / `"Request body must be a valid JSON object"`
2. 400 — `"bookingId is required"` / `"bookingId must be a valid number"`
3. 400 — `"At least one field must be provided for update"`
4. 400 — `"hotelId must be a number"` / `"roomId must be a number"` / `"guestName must be a non-empty string"`
5. 400 — `"checkInDate must be a valid date string"` / `"checkOutDate must be a valid date string"`
6. 400 — `"bookingId must be an integer greater than 0"` / `"hotelId must be an integer greater than 0"` / `"roomId must be an integer greater than 0"`

**Errors (bookingService.updateBooking):**
1. 404 — `"Booking not found"` / `"Hotel not found"` / `"Room not found in the specified hotel"`
2. 400 — `"checkOutDate must be after checkInDate"` / `"Number of nights must be greater than 0"` / `"Total price must be greater than 0"`
3. 409 — `"Room is already booked for the selected dates"`

### DELETE /bookings/:bookingId — roles: `admin`
**Success:** 200 — `{ message: "Booking deleted successfully", booking: <BookingDTO> }`

**Errors:**
1. 400 — `"Request params must be a valid JSON object"`
2. 400 — `"bookingId is required and must be a valid number"`
3. 400 — `"bookingId must be an integer greater than 0"`
4. 404 — `"Booking not found"`

---

## Guest Routes

### POST /guests (No Authentication Required)
**Controller:** `guestController.createGuest()`

**Success:** 201 — User DTO (no password hash)

**Errors:**
1. 400 — `"Request body must be a valid JSON object"`
2. 400 — `"All fields are required"`
3. 400 — `"All fields must be strings"`
4. 400 — `"All fields must be non-empty strings"`
5. 400 — `"Password is required and must be a non-empty string"`
6. 400 — `"Password must be at least 15 characters long"`
7. 400 — `"Email must be a valid email address"`
8. 409 — `"Email already exists"`

### GET /guests/me — role: `guest`
**Success:** 200 — User DTO

**Errors:**
1. 401 — `"Unauthorized"` — req.user falsy (defensive, shouldn't occur post-middleware)
2. 404 — `"User not found"`

### GET /guests/bookings — role: `guest`
**Success:** 200 — array of booking DTOs

**Errors:**
1. 401 — `"User must be authenticated"`

### GET /guests/bookings/:bookingId — role: `guest`
**Success:** 200 — single booking DTO

**Errors:**
1. 401 — `"User must be authenticated"`
2. 400 — `"Booking ID must be a positive integer"`
3. 404 — `"Booking not found"` — also returned when the booking belongs to a different guest (query is scoped by guest_user_id, so ownership violations are indistinguishable from missing bookings)

### POST /guests/bookings — role: `guest`
**Success:** 201 — Booking DTO

**Errors (controller):**
1. 401 — `"User must be authenticated"`
2. 400 — `"Request body must be a valid JSON object"`
3. 400 — `"hotelId, roomId, guestName, checkInDate, and checkOutDate are required"`
4. 400 — `"hotelId must be a positive integer"` / `"roomId must be a positive integer"`
5. 400 — `"guestName must be a non-empty string"`
6. 400 — `"checkInDate must be a valid date string"` / `"checkOutDate must be a valid date string"`

**Errors (bookingService.createBooking):**
1. 404 — `"Hotel not found"` / `"Room not found in the specified hotel"`
2. 400 — `"checkOutDate must be after checkInDate"` / `"Number of nights must be greater than 0"` / `"Total price must be greater than 0"`
3. 409 — `"Room is already booked for the selected dates"`

### PATCH /guests/bookings/:bookingId — role: `guest`
**Success:** 200 — Booking DTO

**Errors (controller):**
1. 401 — `"User must be authenticated"`
2. 400 — `"Booking ID must be a positive integer"`
3. 400 — `"Request body must be a valid JSON object"`
4. 400 — `"At least one of guestName, checkInDate, or checkOutDate must be provided"`
5. 400 — `"guestName must be a non-empty string"`
6. 400 — `"checkInDate must be a valid date string"` / `"checkOutDate must be a valid date string"`

**Errors (guestService.guestUpdateTheirOwnBooking):**
1. 404 — `"Booking not found"` — also covers a different guest's booking (same scoped-query behavior as above)
2. 400 — `"checkOutDate must be after checkInDate"` / `"Number of nights must be greater than 0"` / `"Total price must be greater than 0"`
3. 409 — `"Room is already booked for the selected dates"`

### POST /guests/bookings/:bookingId/cancel — role: `guest`
**Success:** 200 — `{ message: "Booking cancelled successfully", booking: <BookingDTO> }`

**Errors:**
1. 401 — `"User must be authenticated"`
2. 400 — `"Booking ID must be a positive integer"`
3. 404 — `"Booking not found"` — also covers a different guest's booking (query is scoped by guest_user_id; the service's own `booking.guest_user_id !== guestUserId` → 403 check is currently unreachable dead code for this reason)
4. 400 — `"Booking is already cancelled"`
5. 400 — `"Cannot cancel a booking past its check-in date"`

### PATCH /guests/me — role: `guest`
**Success:** 200 — `{ success: true, message: "User information updated successfully", body: <UserDTO> }`

**Errors:**
1. 401 — `"Unauthorized"`
2. 400 — `"Request body must be a valid JSON object"`
3. 400 — `"At least one field (firstName, lastName, password) must be provided"`
4. 400 — `"firstName cannot be an empty string"` / `"lastName cannot be an empty string"` / `"password cannot be an empty string"`
5. 404 — `"User not found"`

---

## Hotel Routes

### GET /hotels (No Authentication Required)
**Success:** 200 — array of hotel DTOs

**Errors:**
1. 400 — `"hotelId must be a single value"` / `"name must be a string"` / `"city must be a string"`
2. 400 — `"hotelId must be a positive integer"`
3. 400 — `"name must be a non-empty string"` / `"city must be a non-empty string"`

### POST /hotels — role: `admin`
**Success:** 201 — Hotel DTO

**Errors:**
1. 400 — `"Request body must be a valid JSON object"`
2. 400 — `"name and city are required fields"`
3. 400 — `"name and city are required and must be non-empty strings"`
4. 400 — `"Hotel already exists"`

### PATCH /hotels/:hotelId — role: `admin`
**Success:** 200 — Hotel DTO

**Errors:**
1. 400 — `"hotelId is required and must be a number"`
2. 400 — `"Request body must be a valid JSON object"`
3. 400 — `"At least one of name or city must be provided and must be non-empty strings"`
4. 404 — `"Hotel not found"`

---

## Room Routes

### GET /rooms — roles: `admin`, `staff`
**Success:** 200 — array of room DTOs

**Errors:**
1. 400 — `"Query parameters must be a valid JSON object"`
2. 400 — `"hotelId must be a number"` / `"roomId must be a number"` / `"type must be a non-empty string"` / `"price must be a number"`
3. 400 — `"hotelId must be a positive integer"` / `"roomId must be a positive integer"` / `"price must be a positive number"`

### GET /available-rooms (No Authentication Required)
**Success:** 200 — array of room DTOs

**Errors (controller):**
1. 400 — `"Query parameters must be a valid object"`
2. 400 — `"hotelId must be a non-empty string"` / `"type must be a non-empty string"` / `"minPrice must be a non-empty string"` / `"maxPrice must be a non-empty string"` / `"checkInDate must be a non-empty string"` / `"checkOutDate must be a non-empty string"`
3. 400 — `"hotelId must be a positive integer"`
4. 400 — `"minPrice must be a non-negative number"` / `"maxPrice must be a non-negative number"`
5. 400 — `"checkInDate must be a valid date string"` / `"checkOutDate must be a valid date string"`

**Errors (roomService.searchAvailableRooms):**
1. 400 — `"minPrice cannot be greater than maxPrice"`
2. 400 — `"Both checkInDate and checkOutDate must be provided together"`
3. 400 — `"checkInDate must be before checkOutDate"`

### POST /rooms — role: `admin`
**Success:** 201 — Room DTO

**Errors:**
1. 400 — `"Request body must be a valid JSON object"`
2. 400 — `"hotelId is required"` / `"type is required"` / `"price is required"`
3. 400 — `"hotelId must be a number"` / `"type must be a non-empty string"` / `"price must be a positive number"`

### PATCH /rooms/:roomId — role: `admin`
**Success:** 200 — Room DTO

**Errors:**
1. 400 — `"Request parameters must be a valid JSON object"`
2. 400 — `"roomId is required and must be a valid number"`
3. 400 — `"roomId must be a positive integer"`
4. 400 — `"Request body must be a valid JSON object"`
5. 400 — `"At least one of type or price must be provided"`
6. 400 — `"type must be a non-empty string"` / `"price must be a positive number"`
7. 404 — `"Room not found"`

---

## User Routes (Admin/Staff)

### POST /users — role: `admin`
**Success:** 201 — User DTO

**Errors:**
1. 400 — `"Request body must be a valid JSON object"`
2. 400 — `"All fields are required"`
3. 400 — `"All fields must be strings"` / `"All fields must be non-empty strings"`
4. 400 — `"password is required and must be a non-empty string"`
5. 400 — `"password must be at least 15 characters long"`
6. 400 — `"email must be a valid email address"`
7. 409 — `"Email already exists"`
8. 400 — `"Only staff users can be created"`

### GET /users — role: `admin`
**Success:** 200 — array of user DTOs

**Errors:**
1. 400 — `"id must be a non-empty string"` / `"email must be a non-empty string"`
2. 400 — `"id must be a positive integer"`
3. 400 — `"email must be a valid email address"`

### GET /users/me — roles: `admin`, `staff`
**Success:** 200 — User DTO

**Errors:**
1. 401 — `"Unauthorized"`
2. 404 — `"User not found"`

### PATCH /users/me — roles: `admin`, `staff`
**Success:** 200 — `{ success: true, message: "User information updated successfully", body: <UserDTO> }`

**Errors:**
1. 401 — `"Unauthorized"`
2. 400 — `"Request body must be a valid JSON object"`
3. 400 — `"At least one field (firstName, lastName, password) must be provided"`
4. 400 — `"firstName cannot be an empty string"` / `"lastName cannot be an empty string"` / `"password cannot be an empty string"`
5. 404 — `"User not found"`

### PATCH /users/:id/deactivate — role: `admin`
**Success:** 200 — `{ success: true, message: "User deactivated successfully", body: <UserDTO> }`

**Errors:**
1. 400 — `"user id path parameter is required and must be a non-empty string"`
2. 400 — `"user id path parameter must be a positive integer"`
3. 404 — `"User not found"` — also returned if the user is already inactive
4. 500 — `"Failed to deactivate user"`

### PATCH /users/:id — role: `admin`
**Success:** 200 — User DTO

**Errors:**
1. 400 — `"userId path parameter is required and must be a non-empty string"`
2. 400 — `"userId path parameter must be a positive integer"`
3. 400 — `"Request body must be a valid JSON object"`
4. 400 — `"At least one field (firstName, lastName, isActive status) must be provided"`
5. 400 — `"firstName cannot be an empty string"` / `"lastName cannot be an empty string"`
6. 400 — `"isActive must be a boolean value"`
7. 404 — `"User not found"`

---

## Known Inconsistencies (not fixed, noted for awareness)

1. **"Booking not found" overloaded**: Guest booking endpoints (view/update/cancel) return 404 `"Booking not found"` both when the booking truly doesn't exist and when it belongs to a different guest, because the repository query is pre-scoped by `guest_user_id`. This is intentionally safer (doesn't confirm existence of another guest's data) but means the `403 "You are not authorized to cancel this booking"` branch in `guestService.cancelOwnBooking` is currently dead code.
2. **Response body shape varies by resource**: Plain arrays (`GET /hotels`, `GET /rooms`), bare DTOs (most `POST`/`PATCH`), and `{ message, ...entity }` wrapped objects (bookings, cancel, user self-update, deactivate) are all used inconsistently — there's no single envelope convention across the API.
3. **Validation message wording differs slightly for the same concept** across endpoints (e.g. `"X must be a valid date string"` vs `"X must be a non-empty string"` vs `"X is required"` for conceptually similar "missing/invalid field" cases).

These are documented here rather than fixed, since changing message wording or response shape now would break existing passing tests. Revisit only as a deliberate API-contract cleanup task.
