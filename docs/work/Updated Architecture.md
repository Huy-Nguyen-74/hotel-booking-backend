# Hotel Booking Backend

## Architecture V1
Created: 2026-05-29

### Goal

Learn backend engineering through building a hotel booking system.

Core entities:
- Hotel
- Room
- Booking

Principles:
- Simple
- Readable
- Easy to explain
- Easy to extend

Current structure:
- Routes
- Data
- Helpers

Future:
- PostgreSQL
- Authentication
- AWS deployment






## Architecture V2

Updated: 2026-06-09

### Current Request Flow

```text
Client
  ↓
Express Server
  ↓
Route
  ↓
PostgreSQL
  ↓
Response
```

The client sends an HTTP request to the Express server.

Routes contain the business logic for handling requests.

Routes communicate with PostgreSQL to retrieve, create, update, or delete data.

The server then returns a response to the client.

---

### Error Handling Architecture

```text
Client
  ↓
Route
  ↓
Business Validation
  ↓
AppError
  ↓
errorHandler Middleware
  ↓
Response
```

Examples of business validation:

* Booking not found
* Hotel not found
* Room not found
* Invalid date range
* Overlapping booking

When a business rule fails, the route throws an AppError.

Example:

```ts
throw new AppError("Booking not found", 404);
```

The error is forwarded to the centralized errorHandler middleware.

The middleware formats a consistent error response for the client.

Example response:

```json
{
  "success": false,
  "message": "Booking not found"
}
```

---

### Error Categories

#### Business Errors

Expected errors caused by invalid user requests.

Examples:

* Booking not found
* Hotel not found
* Invalid dates
* Overlapping bookings

These are handled using:

```ts
AppError
```

---

#### Technical Errors

Unexpected runtime failures.

Examples:

* Database connection failure
* SQL errors
* Network issues
* Programming mistakes

These are caught by:

```ts
try/catch
```

and forwarded to:

```ts
errorHandler
```

which returns:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

with HTTP status code 500.

---

### Design Principles

1. Fail Fast

Validate data as soon as it becomes available.

Example:

```ts
if (!booking) {
  throw new AppError("Booking not found", 404);
}
```

instead of continuing with invalid data.

2. Centralized Error Handling

Routes identify problems.

The middleware formats error responses.

This avoids duplicating response logic across multiple routes.

3. Separation of Responsibilities

Routes:

* Business logic
* Database operations

AppError:

* Represents expected business failures

errorHandler:

* Formats error responses
* Handles unexpected runtime errors




---

## Architecture V3

Updated: 2026-06-16

### Testing Architecture

```text
npm test
  ↓
resetTestDb.ts
  ↓
migrations/
  ↓
seed.sql
  ↓
PostgreSQL Sequence Synchronization
  ↓
Jest + Supertest
  ↓
Test Results
```

A dedicated PostgreSQL test database is used to ensure tests run against a clean and predictable dataset.

Before every test run:

1. Tables are recreated from migrations
2. Seed data is loaded from `seed.sql`
3. PostgreSQL sequences are synchronized with seeded IDs
4. Jest integration tests are executed

This prevents tests from affecting development data and ensures consistent results.

---

### CI/CD Architecture

```text
Developer
  ↓
Git Push
  ↓
GitHub Actions
  ↓
PostgreSQL Service Container
  ↓
npm test
  ↓
Test Results
```

Every push to the `main` branch automatically triggers the GitHub Actions workflow.

The workflow:

1. Creates a PostgreSQL service container
2. Installs project dependencies
3. Resets the test database
4. Runs migrations and loads seed data
5. Executes the Jest test suite

This verifies that the application works in a clean environment outside the developer's local machine.

---

### Environment-Based Database Selection

```text
NODE_ENV = undefined
        ↓
hotel_booking

NODE_ENV = test
        ↓
hotel_booking_test
```

The application automatically selects the database based on the current environment.

Development uses:

```text
hotel_booking
```

Automated tests use:

```text
hotel_booking_test
```

This separation prevents test runs from modifying development data.

---

### Current Status

Completed:

* PostgreSQL integration
* Centralized error handling
* Booking validation
* Jest integration testing
* Supertest API testing
* Dedicated PostgreSQL test database
* Automated test database reset
* GitHub Actions CI pipeline

Next milestones:

* Authorization
* Authentication and authorization integration tests
* Docker
* AWS deployment



---

## Architecture V4

Updated: 2026-06-22

### Deployment Architecture

```text
Client
  ↓
AWS EC2 Public IP
  ↓
Express API
  ↓
PostgreSQL
```

The Express API and PostgreSQL database run on the same AWS EC2 instance.

The EC2 Security Group allows public access to the API through port 3000.

---

### Production Process Management

```text
AWS EC2
  ↓
systemd
  ↓
PM2
  ↓
Node.js Application
```

PM2 manages the Node.js application process.

systemd starts PM2 automatically when the EC2 instance boots.

This allows the application to recover automatically after an EC2 reboot.

---

### CI/CD Architecture

```text
Developer
  ↓
Git Push
  ↓
GitHub Actions
  ↓
Run Jest Tests
  ↓
Deploy to AWS EC2
  ↓
git pull
  ↓
npm install
  ↓
npm run build
  ↓
pm2 restart
```

Every push to the `main` branch triggers GitHub Actions.

The workflow first runs automated integration tests using a PostgreSQL service container.

If the tests pass, GitHub Actions connects to EC2 through SSH and deploys the latest code.

Deployment includes:

1. Pull latest code from GitHub
2. Install dependencies
3. Build the TypeScript project
4. Restart the PM2 process

---

### Environment Overview

```text
Development Environment

VS Code
  ↓
Node.js
  ↓
hotel_booking
```

```text
Testing Environment

npm test
  ↓
hotel_booking_test
```

```text
Production Environment

Client
  ↓
AWS EC2
  ↓
hotel_booking
```

The application automatically selects the appropriate database based on the current environment.

Development uses:

```text
hotel_booking
```

Automated tests use:

```text
hotel_booking_test
```

This prevents tests from modifying development or production data.

---

### Current Status

Completed:

* PostgreSQL integration
* Centralized error handling
* Booking validation
* Jest integration testing
* Supertest API testing
* Dedicated PostgreSQL test database
* Automated test database reset
* GitHub Actions CI pipeline
* GitHub Actions CD pipeline
* AWS EC2 deployment
* PM2 process management
* systemd startup configuration
* EC2 reboot recovery verification

Next milestones:

* Authorization
* Authentication and authorization integration tests
* Docker
* Expanded endpoint test coverage

---

## Architecture V5 — Current Complete System

Updated: 2026-09-05  
Status: Authoritative current architecture

V1–V4 above are retained as the project's architecture evolution history. V5 describes the completed system.

### System Overview

```text
Client / Swagger UI
        ↓
Express Routes
        ↓
Authentication and Authorization Middleware
        ↓
Controllers
        ↓
Services
        ↓
Repositories
        ↓
PostgreSQL
```

External payment events enter through a separate verified webhook boundary:

```text
Stripe
  ↓ signed webhook
Raw-body Webhook Route
  ↓ signature verification
Payment Service
  ↓
Payment Repository
  ↓
PostgreSQL
```

### Layer Responsibilities

#### Routes and Middleware

* Define endpoints and allowed HTTP methods.
* Authenticate JWTs.
* Enforce role-based access for `admin`, `staff`, and `guest`.
* Preserve the raw request body required for Stripe webhook verification.

#### Controllers

* Read request parameters, query values, and bodies.
* Validate raw presence and type.
* Normalize input once into canonical values.
* Reject common invalid input and pass validated data to Services.
* Convert results into API DTOs and select the HTTP status code.

Controllers do not contain SQL or own core business decisions.

#### Services

* Own business workflows and rules.
* Enforce booking ownership and staff/guest behavior.
* Validate hotel, room, booking, and payment relationships.
* Calculate booking prices from trusted server-side data.
* Coordinate PostgreSQL repositories and the Stripe API.
* Throw `AppError` for expected business failures.

#### Repositories

* Own PostgreSQL queries and database row types.
* Return rows or `null` when a matching record may not exist.
* Do not decide HTTP responses or application permissions.
* Use database constraints as the final integrity boundary.

#### DTOs

* Convert PostgreSQL `snake_case` rows into API `camelCase` responses.
* Exclude sensitive fields such as `password_hash`.
* Keep database representation separate from the public API contract.

### Main Domains

* **Authentication:** password hashing, login, JWT generation, and password reset.
* **Users:** admin/staff management plus guest registration and self-service profile access.
* **Hotels and Rooms:** management, public hotel search, and availability search.
* **Bookings:** staff-created and guest-owned bookings, updates, history, cancellation, and overlap prevention.
* **Payments:** Stripe PaymentIntent creation, local persistence, pending reuse, failed-attempt retry, and webhook-driven final status updates.

### Identity, Authorization, and Ownership

JWT authentication establishes the current actor. Authorization is enforced through both role and resource ownership:

* Admin and staff use protected operational endpoints.
* Guests use dedicated self-service endpoints.
* Guests can access only their own profiles and bookings.
* Ownership-scoped lookups return `404` when another guest's resource is requested, avoiding disclosure that it exists.
* Staff-created bookings record the acting staff user; guest-created bookings record the guest as both owner and actor where applicable.

### Booking Consistency

* A room must belong to the selected hotel.
* Check-out must be later than check-in.
* Booking price is calculated by the backend.
* Active bookings use strict overlap comparisons, allowing same-day room turnover.
* Cancelled bookings remain in history but no longer block availability.
* Foreign keys and check constraints protect relational integrity.

### Payment Consistency and Security

* The backend obtains the payment amount from the stored booking; it never trusts a client-supplied amount.
* Stripe idempotency keys prevent duplicate PaymentIntent creation for the same logical attempt.
* An existing `pending` payment is reused and returns the same `clientSecret`.
* A `succeeded` payment prevents another attempt.
* A `failed` payment permits a new attempt.
* Concurrent inserts use `ON CONFLICT ... DO NOTHING`; the losing request loads and reuses the row created by the winning request.
* Stripe webhook signatures are verified before local payment status is updated.
* Stripe is mocked in automated tests; live Stripe account validation is outside the completed application scope.

### Error Handling

Expected business errors flow through `AppError` to the centralized error handler and produce a consistent safe response:

```json
{
  "success": false,
  "message": "..."
}
```

Unexpected failures are logged on the server and return a generic HTTP `500` response without exposing internal details.

### Database and Migrations

PostgreSQL is the system of record. Versioned migrations are the source of truth for schema evolution, including users, hotels, rooms, bookings, guest ownership, cancellation state, and payments.

Development and test data remain isolated:

```text
Development → hotel_booking
Test        → hotel_booking_test
```

### Testing Architecture

```text
npm test
  ↓
Reset dedicated test database
  ↓
Apply migrations
  ↓
Load deterministic seed data
  ↓
Jest + Supertest integration tests
```

The completed suite contains **242 integration tests** covering authentication, authorization, ownership, validation, booking workflows, payments, webhook behavior, and concurrency. TypeScript type checking is a separate required verification step.

### Docker Architecture

Docker Compose provides a reproducible local environment:

```text
Docker Compose
  ├─ Backend container
  └─ PostgreSQL 16 container + persistent volume
```

The backend waits for PostgreSQL health, runs outstanding migrations automatically, and then starts the API. The completed code and migrations `005–008` were rebuilt and verified with all 242 tests passing inside Docker.

### CI/CD and Production

```text
Git Push
  ↓
GitHub Actions
  ├─ Type checking and integration tests
  └─ Deployment workflow
        ↓
      AWS EC2
        ↓
      PM2 + systemd
```

GitHub Actions verifies the project in a clean environment. The deployment process builds the latest TypeScript source and restarts the PM2-managed application on AWS EC2. `systemd` restores PM2-managed processes after reboot.

### API Documentation

The OpenAPI specification documents Auth, Users, Hotels, Rooms, Bookings, Guest, and Payment endpoints, including JWT security, reusable schemas, request and response contracts, and Stripe-to-backend webhook behavior. Swagger UI provides an explorable interface without requiring source-code inspection.

### Final Status

* Unified Controller → Service → Repository architecture complete
* Guest Journey complete
* Payments and verified webhooks complete
* OpenAPI and README current
* Docker synchronized with the completed system
* Typecheck passed
* 242 integration tests passed locally and inside Docker
* WIP merged into `main`
* GitHub Actions 2/2 green on the final `main` commit

The technical build phase is complete. Applications and interview preparation are now the active phase; additional architecture features are optional and must not delay applications.
