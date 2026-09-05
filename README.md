# Hotel SaaS Backend

A production-oriented REST API for hotel operations, including authentication, role-based authorization, guest journeys, hotels, rooms, bookings, and payments.

The project uses a layered **Controller → Service → Repository** architecture, PostgreSQL with raw SQL, automated integration testing, CI/CD, AWS deployment, and a reproducible Docker development environment.

## Current Status

- Auth, Users, Hotels, Rooms, Bookings, Guest Journey, and Payments completed
- JWT authentication and role-based authorization
- Guest registration, login, profile, password reset, hotel/room search, and ownership-scoped booking management
- Stripe PaymentIntent workflow with trusted server-side pricing, idempotency, persistence, and verified webhook handling
- Swagger UI with an OpenAPI 3.0.3 contract
- Centralized error handling with consistent API responses
- Database migrations as the schema source of truth
- DTO conversion from PostgreSQL `snake_case` rows to API `camelCase` responses
- 242 integration tests passing
- GitHub Actions CI/CD
- AWS EC2 deployment with PM2 and systemd
- Reproducible Docker setup verified from a clean volume

## Architecture

```text
Client
  ↓
Express Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
PostgreSQL
```

### Layer responsibilities

- **Routes** connect HTTP methods and paths to middleware and controllers.
- **Controllers** validate raw request data, normalize it, enforce request-level rules, and send responses.
- **Services** contain business rules and coordinate operations.
- **Repositories** contain SQL and database access only.
- **DTOs** convert internal database models into safe external API responses.
- **Middleware** handles authentication, authorization, and centralized errors.

## Tech Stack

- **Backend:** Node.js, TypeScript, Express
- **Database:** PostgreSQL 16, `pg`, raw SQL, `node-pg-migrate`
- **Authentication:** JWT, bcrypt
- **Payments:** Stripe SDK (test-mode integration)
- **API Documentation:** OpenAPI 3.0.3, Swagger UI
- **Testing:** Jest, Supertest
- **Infrastructure:** Docker, Docker Compose, AWS EC2, PM2, systemd
- **CI/CD:** GitHub Actions

## Core Features

### Authentication and users

- Email and password login
- Password hashing with bcrypt
- JWT generation and verification
- Admin, staff, and guest roles
- Protected routes
- User creation, profile access, updates, and deactivation
- Sensitive fields excluded from API responses

### Hotels and rooms

- View, create, update, and filter hotels
- View rooms and rooms belonging to a hotel
- Create and update rooms
- Validate hotel and room relationships

### Bookings

- View, create, update, and delete bookings
- Filter bookings
- Verify that the hotel and room exist
- Verify that the room belongs to the selected hotel
- Prevent overlapping reservations
- Require check-out after check-in
- Calculate nights and total price on the server

### Guest journey

- Register, log in, view/update profile, and reset password
- Search hotels and available rooms through public endpoints
- Create, view, update, and cancel owned bookings
- Prevent guests from accessing another guest's data
- Preserve cancelled bookings in history while releasing room availability

### Payments

- Create a Stripe PaymentIntent from the trusted booking total stored in PostgreSQL
- Reuse the same pending PaymentIntent and payment row for duplicate requests
- Create a new payment attempt after a failed attempt
- Reject payment for cancelled, unowned, or already-paid bookings
- Verify Stripe webhook signatures before updating local payment status
- Map final Stripe events to local `succeeded` or `failed` status

## Booking Business Rules

The client sends the booking inputs:

```json
{
  "hotelId": 1,
  "roomId": 2,
  "guestName": "Huy Nguyen",
  "checkInDate": "2026-08-10",
  "checkOutDate": "2026-08-13"
}
```

The backend calculates:

```text
nights = checkOutDate - checkInDate
totalPrice = roomPrice × nights
```

The client cannot set `nights` or `totalPrice`, preventing price manipulation.

For an existing reservation from June 10 to June 15:

- June 12 to June 18 is rejected.
- June 8 to June 11 is rejected.
- June 15 to June 20 is accepted.

## Database

The PostgreSQL server contains two separate logical databases:

- `hotel_booking` — local development data
- `hotel_booking_test` — isolated automated-test data

The schema is created and updated through migrations in `migrations/`.

Main tables:

- `users`
- `hotels`
- `rooms`
- `bookings`
- `payments`

## Quick Start with Docker

Docker is the recommended local setup because it reproduces the backend, PostgreSQL server, databases, networking, and environment consistently.

### Prerequisites

- Git
- Docker Desktop with Docker Compose

### 1. Clone the repository

```bash
git clone <repository-url>
cd hotel-booking-backend
```

### 2. Create the Docker environment file

Copy `.env.docker.example` to `.env.docker`.

PowerShell:

```powershell
Copy-Item .env.docker.example .env.docker
```

macOS/Linux:

```bash
cp .env.docker.example .env.docker
```

Replace the placeholder values inside `.env.docker`. Do not commit this file.

### 3. Build and start the complete local system

```bash
docker compose --env-file .env.docker up -d --build
```

This single command:

1. Builds the backend image from `Dockerfile`.
2. Starts the backend and PostgreSQL containers.
3. Creates `hotel_booking`.
4. Creates `hotel_booking_test` when PostgreSQL initializes a new empty volume.
5. Waits until PostgreSQL is healthy.
6. Runs database migrations.
7. Starts the API.

The API is available at:

```text
http://localhost:3000
```

Docker PostgreSQL is exposed to the host at:

```text
localhost:5433
```

PostgreSQL still uses port `5432` inside the Docker network.

### Check container status

```bash
docker compose --env-file .env.docker ps
```

### Run all integration tests inside Docker

```bash
docker compose --env-file .env.docker exec backend npm test
```

The test command resets only `hotel_booking_test`. It does not reset `hotel_booking`.

### Stop containers and preserve database data

```bash
docker compose --env-file .env.docker down
```

This removes the containers and Compose network but keeps the named PostgreSQL volume.

### Reset the entire local Docker database environment

```bash
docker compose --env-file .env.docker down -v
```

This also deletes the named volume, including both local Docker databases. Use it only when a clean database rebuild is intentional.

## Docker Data Persistence

```text
PostgreSQL container
  ↓ reads/writes
postgres_data named volume
  ↓ physically stores
hotel_booking + hotel_booking_test
```

Containers are replaceable. The named volume stores PostgreSQL's physical files so both logical databases survive ordinary container deletion and recreation.

The initialization script in `docker/init-test-db.sql` runs only when PostgreSQL initializes a brand-new empty volume.

## Running Without Docker

This path assumes PostgreSQL and the required databases already exist on the host machine.

```bash
npm install
npm run db:migrate
npm run dev
```

Host configuration is read from `.env`.

## Testing

The project has **242 Jest and Supertest integration tests**.

Before each test run:

1. `resetTestDb.ts` connects through `TEST_DATABASE_URL`.
2. Test tables are recreated from migrations.
3. `seed.sql` loads predictable test records.
4. PostgreSQL sequences are synchronized.
5. Jest executes the integration suite.

Run on the host:

```bash
npm test
```

Run type checking:

```bash
npm run typecheck
```

Run inside Docker:

```bash
docker compose --env-file .env.docker exec backend npm test
```

Coverage includes authentication, authorization, ownership, users, hotels, rooms, bookings, payments, Stripe idempotency and webhook behavior, validation, conflicts, and error contracts. Stripe calls and signed events are mocked in automated tests; running the payment flow against Stripe directly requires local test-mode credentials.

## CI/CD

Every push to the `main` branch triggers GitHub Actions.

```text
Push to `main`
  ↓
GitHub Actions
  ↓
Start a temporary PostgreSQL service
  ↓
Provide TEST_DATABASE_URL and JWT_SECRET
  ↓
Install dependencies
  ↓
Reset and seed the test database
  ↓
Run 242 integration tests
  ↓
Deploy to AWS EC2 only after tests pass
  ↓
Install, build, and restart the PM2 application
```

Deployment proceeds only after the test workflow succeeds.

## AWS Deployment

The current production deployment uses:

```text
Client
  ↓
Express API on AWS EC2
  ↓
PostgreSQL on AWS EC2
```

- PM2 manages the Node.js process.
- systemd restores PM2 after an EC2 reboot.
- GitHub Actions deploys the latest tested code.
- Public API connectivity and reboot recovery have been verified.

Docker currently provides the reproducible local development environment; the existing EC2 production runtime remains PM2-based.

## Project Structure

```text
hotel-booking-backend/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middleware/
│   ├── database/
│   ├── errors/
│   ├── helpers/
│   ├── app.ts
│   └── server.ts
├── DTO/
├── __tests__/
├── migrations/
├── docker/
│   └── init-test-db.sql
├── docs/
│   └── architecture.md
├── .github/
│   └── workflows/
├── Dockerfile
├── compose.yaml
├── .dockerignore
├── .env.example
├── .env.docker.example
├── seed.sql
├── package.json
└── README.md
```

## Key Design Decisions

- **Raw SQL instead of an ORM:** demonstrates SQL, joins, constraints, and database relationships directly.
- **Migrations as the schema source of truth:** every environment can rebuild the same schema.
- **Separate development and test databases:** automated tests cannot damage development data.
- **Layered architecture:** HTTP handling, business logic, and SQL remain separated.
- **DTO boundary:** database naming and sensitive fields do not leak into external responses.
- **Dockerized local environment:** new developers can reproduce the complete local system with one startup command.
- **Trusted payment amount:** Stripe receives the booking total loaded by the backend, never a client-supplied amount.
- **Idempotent payment attempts:** duplicate requests reuse one pending PaymentIntent; a failed attempt creates a new one.
- **Verified webhooks:** payment status changes only after Stripe signature verification against the raw request body.

## Roadmap

Completed phases include Swagger/OpenAPI, the full guest journey, and Stripe payment handling with idempotency and verified webhooks.

Current phase: job applications and interview preparation.

Later improvements that do not block applications include structured logging, metrics, Redis, background jobs, email delivery, audit logs, and multi-tenancy.
