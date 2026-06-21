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
schema.sql
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

1. Tables are recreated from `schema.sql`
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
4. Loads schema and seed data
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

* Service layer
* Controller layer
* Authentication
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

* Authentication
* Authorization
* Service layer
* Controller layer
* Docker
* Database migrations