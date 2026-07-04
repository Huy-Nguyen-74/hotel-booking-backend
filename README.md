# Hotel Booking Backend

## Overview

Hotel Booking Backend is a REST API for managing hotels, rooms, and bookings.

The project was built as part of a backend engineering transition journey using Node.js, TypeScript, Express, and PostgreSQL. The system allows users to view hotels and rooms, create bookings, update bookings, and prevent conflicting reservations through business-rule validation.

---

## Highlights

- RESTful API built with Node.js, TypeScript, and Express
- PostgreSQL database integration using raw SQL
- Automated integration testing with Jest and Supertest
- CI/CD pipeline with GitHub Actions
- Deployed to AWS EC2 with PM2 and systemd
- Automatic recovery verified after EC2 reboot

---

## Tech Stack

### Backend

* Node.js
* TypeScript
* Express

### Database

* PostgreSQL
* node-postgres (pg)

### Testing

* Jest
* Supertest

### CI/CD

GitHub Actions

- Continuous Integration (CI)
  - Runs automated Jest integration tests on every push

- Continuous Deployment (CD)
  - Deploys the application to AWS EC2 after successful test execution
  - Pulls the latest code
  - Installs dependencies
  - Builds the application
  - Restarts the PM2 process

### Tools

* Thunder Client
* Git
* GitHub

---

## Features

### Hotel Management

* View all hotels
* View hotel details by ID
* Search hotels by city

### Room Management

* View all rooms
* View rooms belonging to a specific hotel

### Booking Management

* Create bookings
* Update bookings
* Delete bookings
* View all bookings
* View booking details

### Booking Validation

The API validates that:

* Required fields are provided
* The selected hotel exists
* The selected room exists
* The room belongs to the selected hotel
* Check-out date is after check-in date
* Booking dates do not overlap existing reservations

### Automatic Calculations

The system automatically calculates:

* Number of nights
* Total booking price

---

## Database Schema

### hotels

| Column | Type    |
| ------ | ------- |
| id     | integer |
| name   | text    |
| city   | text    |

### rooms

| Column   | Type    |
| -------- | ------- |
| id       | integer |
| hotel_id | integer |
| type     | text    |
| price    | numeric |

### bookings

| Column         | Type    |
| -------------- | ------- |
| id             | integer |
| hotel_id       | integer |
| room_id        | integer |
| guest_name     | text    |
| check_in_date  | date    |
| check_out_date | date    |
| nights         | integer |
| total_price    | numeric |

---

## API Endpoints

### Hotels

| Method | Endpoint           |
| ------ | ------------------ |
| GET    | /                  |
| GET    | /hotels            |
| GET    | /hotels/:id        |
| GET    | /hotels/city/:city |
| GET    | /rooms             |
| GET    | /hotels/:id/rooms  |

### Bookings

| Method | Endpoint      |
| ------ | ------------- |
| GET    | /bookings     |
| GET    | /bookings/:id |
| POST   | /bookings     |
| PATCH  | /bookings/:id |
| DELETE | /bookings/:id |

---

## Example Booking Request

POST /bookings

```json
{
  "hotelId": 1,
  "roomId": 2,
  "guestName": "Huy Nguyen",
  "checkInDate": "2026-06-10",
  "checkOutDate": "2026-06-13"
}
```

---

## Business Logic

### Prevent Overlapping Bookings

A room cannot be booked for dates that overlap with an existing reservation.

Example:

Existing booking:

* June 10 → June 15

Rejected bookings:

* June 12 → June 18
* June 08 → June 11
* June 10 → June 15

Accepted bookings:

* June 01 → June 09
* June 15 → June 20

---

### Automatic Price Calculation

The API calculates:

```text
nights = checkOutDate - checkInDate

totalPrice = roomPrice × nights
```

This prevents clients from sending incorrect pricing information.

---

## Testing

This project includes automated integration tests using Jest and Supertest.

Tests run against a dedicated PostgreSQL test database:

```text
hotel_booking_test
```

Before each test run:

1. The test database is reset
2. Database tables are recreated from migrations
3. Seed data is loaded from `seed.sql`
4. PostgreSQL sequences are synchronized with seeded IDs
5. Jest integration tests are executed

Schema source of truth:

* Migrations in `migrations/`
* `schema.sql` is kept as a reference snapshot

Current test coverage includes:

* Booking creation
* Booking updates
* Booking deletion
* Required field validation
* Hotel existence validation
* Room existence validation
* Date validation
* Booking overlap prevention

Run tests:

```bash
npm test
```

---

## Continuous Integration

GitHub Actions automatically runs the full test suite on every push to the `main` branch.

Workflow:

1. Start PostgreSQL service container
2. Install project dependencies
3. Reset the test database
4. Load schema and seed data
5. Run Jest integration tests

This ensures that code changes are verified in a clean environment outside the local development machine.

---

## Continuous Deployment

GitHub Actions automatically deploys the application to AWS EC2 after the test workflow completes successfully.

Deployment workflow:

1. Connect to EC2 using SSH
2. Pull the latest code from GitHub
3. Install dependencies
4. Build the application
5. Restart the PM2 process

This ensures production stays synchronized with the latest tested version of the application.

---

## Design Decisions

This project intentionally uses raw SQL through PostgreSQL rather than an ORM.

The goal is to gain a deeper understanding of:

* Database relationships
* SQL queries
* Data validation
* PostgreSQL sequences
* Backend business logic

A dedicated test database was introduced to isolate automated tests from development data.

Seed data uses fixed IDs for predictable test scenarios. After seeding, PostgreSQL sequences are synchronized to ensure newly created records continue from the correct ID values.

---

## Project Structure

```text
hotel-booking-backend/
│
├── src/
│   ├── database/
│   │   ├── db.ts
│   │   ├── resetTestDb.ts
│   │   └── testConnection.ts
│   │
│   ├── data/
│   ├── errors/
│   ├── helpers/
│   ├── middleware/
│   ├── routes/
│   │   ├── hotelRoutes.ts
│   │   └── bookingRoutes.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── __tests__/
│   └── booking.test.ts
│
├── .github/
│   └── workflows/
│       └── test.yml
│
├── docs/
│   └── architecture.md
│
├── schema.sql
├── seed.sql
├── package.json
└── README.md
```

---

## Running Locally

### Install Dependencies

```bash
npm install
```

### Start Server

```bash
npx ts-node src/server.ts
```

Server runs on:

```text
http://localhost:3000
```

---

## AWS Deployment

This project is deployed on AWS EC2.

Architecture:

Browser
    ↓
Express API
(AWS EC2)
    ↓
PostgreSQL
(AWS EC2)

Deployment includes:
- AWS EC2
- PostgreSQL
- PM2 process management
- systemd startup configuration

Deployment verification:

- Public API accessible through EC2 public IP
- PostgreSQL connectivity verified
- PM2 process management configured
- Automatic recovery after EC2 reboot tested
- Jest integration tests passing on EC2

---

## Future Improvements

Planned enhancements:

* Authentication and authorization
* Request validation library
* Service and controller layers
* Room availability endpoint
* Docker containerization
* API documentation with Swagger