# Osaka Backend Engineer Roadmap

## Current Status — September 5, 2026

### Completed

- ✅ Unified Hotel SaaS
- ✅ Controller → Service → Repository architecture
- ✅ Authentication and role-based authorization
- ✅ Users, Hotels, Rooms, and Bookings
- ✅ PostgreSQL and raw SQL
- ✅ Database migrations as schema source of truth
- ✅ Centralized error handling
- ✅ DTO conversion: `snake_case` → `camelCase`
- ✅ TypeScript contract cleanup
- ✅ Guest Journey
- ✅ Swagger / OpenAPI
- ✅ README and setup documentation
- ✅ GitHub Actions CI/CD
- ✅ AWS EC2 + PM2 + systemd deployment
- ✅ Reproducible Docker development environment
- ✅ Automatic development and test database creation
- ✅ Clean-volume Docker verification
- ✅ Docker environment template
- ✅ Payments: PaymentIntent creation, persistence, verified webhooks, and status updates
- ✅ Trusted server-side pricing, idempotency, pending reuse, and failed-attempt retry behavior
- ✅ Race-safe concurrent payment persistence
- ✅ Payments documented in OpenAPI and README
- ✅ Docker rebuilt from the completed codebase; migrations `005–008` applied
- ✅ 242 integration tests passing locally and inside Docker
- ✅ Superseded admin project audited and archived under `legacy-projects`
- ✅ WIP merged into `main`
- ✅ GitHub Actions 2/2 green on the final `main` commit

**Current Phase:** Phase 9 — Applications and Interview Preparation  
**Current Checkpoint:** Technical build complete and merged — September 5, 2026  
**Interview / Application Target:** Start now — September 2026

---

## Verification Rule

Complete each engineering phase with:

```bash
npm run typecheck
npm test
```

For infrastructure or CI changes, also verify:

- GitHub Actions is green.
- Docker setup works from a clean volume when relevant.
- Documentation matches the actual commands and environment behavior.

---

## Phase 1 — Backend Foundation ✅

**Completed:** July 17

- [x] Unified Hotel SaaS architecture
- [x] Controller → Service → Repository structure
- [x] Auth, Users, Hotels, Rooms, and Bookings
- [x] PostgreSQL and raw SQL repositories
- [x] Database migrations
- [x] Centralized error handling
- [x] AWS EC2 deployment
- [x] PM2 and systemd process recovery
- [x] GitHub Actions CI/CD

---

## Phase 2 — Integration Testing ✅

**Completed:** July 17

- [x] 147 tests passing
- [x] Dedicated test database
- [x] Test database reset from migrations
- [x] Predictable seed data
- [x] Stable API contracts
- [x] Reliable CI pipeline

---

## Phase 3 — Validation and DTO Cleanup ✅

**Completed:** July 21

- [x] Consistent controller validation
- [x] Raw validation before normalization
- [x] Business validation on canonical values
- [x] Centralized `AppError`
- [x] No harmful validation duplication
- [x] DTO conversion before API responses
- [x] Sensitive fields excluded
- [x] Type checking added to verification workflow

---

## Phase 4 — Docker ✅

**Completed:** July 26

### Completed Work

- [x] Backend `Dockerfile`
- [x] Docker Compose configuration
- [x] PostgreSQL 16 container
- [x] Separate `.env.docker` configuration
- [x] Committed `.env.docker.example` template
- [x] Backend-to-PostgreSQL container networking
- [x] Host and container port mapping
- [x] Persistent PostgreSQL named volume
- [x] PostgreSQL health check
- [x] Backend waits for PostgreSQL readiness
- [x] Automatic migrations before API startup
- [x] Automatic `hotel_booking` creation
- [x] Automatic `hotel_booking_test` creation through `docker/init-test-db.sql`
- [x] Environment-driven `DATABASE_URL`
- [x] Environment-driven `TEST_DATABASE_URL`
- [x] Test reset script works on Windows, Docker, and CI
- [x] Fresh project and clean-volume setup verified
- [x] 147 integration tests passing inside the fresh Docker environment
- [x] Container removal and volume persistence verified
- [x] Temporary reproducibility-check project removed
- [x] Original Docker environment restored
- [x] GitHub CI updated with its own `TEST_DATABASE_URL`
- [x] GitHub CI and deployment green after the refactor
- [x] Docker rebuilt after Guest Journey and Payments were completed
- [x] Guest Journey and Payments migrations (`005–008`) applied to the preserved Docker database
- [x] Current backend started successfully with PostgreSQL healthy
- [x] All 242 tests passed inside the rebuilt Docker environment

### Completion Criteria

- [x] One documented command builds and starts the local system
- [x] Backend and PostgreSQL start successfully
- [x] Both local Docker databases are created automatically
- [x] Migrations run automatically
- [x] API starts after PostgreSQL becomes healthy
- [x] Tests pass inside Docker
- [x] A new developer has a complete environment-variable template
- [x] Setup succeeds from a genuinely fresh volume
- [x] Ordinary container deletion does not delete database data

---

## Phase 5 — Swagger / OpenAPI ✅

**Completed:** August 16, 2026

### Tasks

- [x] Install and configure Swagger tooling
- [x] Expose Swagger UI
- [x] Define the OpenAPI document
- [x] Document authentication and JWT usage
- [x] Document Users endpoints
- [x] Document Hotels endpoints
- [x] Document Rooms endpoints
- [x] Document Bookings endpoints
- [x] Add request examples
- [x] Add success response examples
- [x] Add validation, authentication, authorization, not-found, and conflict errors

### Completion Criteria

- [x] All important endpoints are documented
- [x] Protected endpoints support JWT authorization through Swagger UI
- [x] API requests can be explored without reading the source code
- [x] Documentation matches actual request and response contracts
- [x] Type checking, tests, and CI remain green

---

## Phase 6 — README and Documentation ✅

**Completed early:** July 26

### Completed Work

- [x] Project overview
- [x] Current architecture
- [x] Layer responsibilities
- [x] Core business features
- [x] Booking business rules
- [x] Database overview
- [x] Reproducible Docker quick start
- [x] Environment-template instructions
- [x] Automatic database and migration behavior
- [x] Docker test command
- [x] Volume persistence and reset behavior
- [x] Non-Docker setup
- [x] Testing workflow
- [x] CI/CD workflow
- [x] AWS deployment
- [x] Project structure
- [x] Key design decisions
- [x] Current roadmap

### Completion Criteria

- [x] Repository is understandable within a few minutes
- [x] Clean-environment setup instructions are documented
- [x] README reflects the completed Docker phase
- [x] CI wording correctly states that pushes to `main` trigger the workflow

Swagger/OpenAPI is complete. Any README wording refresh can be handled during final polish if needed.

---

## Phase 7 — Guest Journey ✅

**Started:** July 28, 2026  
**Target:** August 1–16  
**Status:** ✅ Completed — August 11, 2026

Extend the existing Users and Auth modules with the `guest` role. Do not create a separate authentication system.

### Working Rule

Finish work in this order:

1. Complete the feature flow
2. Resolve current-module cleanup and red lines
3. Run `npm run typecheck`
4. Run `npm test`
5. Commit

Non-blocking cleanup should not interrupt feature implementation.

### Guest Account and Authentication ✅

- [x] Guest registration -> 8 tests all passed
- [x] Guest login -> 9 tests all passed, also revised the previous auth tests based on the new Test Framework
- [x] Guest profile -> done
- [x] Update guest profile -> done
- [x] Password reset request -> done
- [x] Password reset confirmation -> done

Now, all 178 tests and typecheck passed - so this block is finished.

### Room & Hotel Search ✅

- [x] Search hotels by name and city
  - Shared public route
  - No authentication or authorization required

- [x] Search room availability by hotel, type, min price and maxprice, check-in date and check-out date
  - Shared public route
  - No authentication or authorization required

- [x] Require both dates when either date is provided

- [x] Reject invalid date ranges

- [x] Move `searchAvailableRooms` from Guest Controller/Service into Room Controller/Service

Current access rules:

- Get hotels: public
- Search available rooms: public
- General room search: restricted to admin and staff

Testing completed on August 3, 2026:

- [x] Revised `hotel.test.ts` for public `GET /hotels`
- [x] Added anonymous hotel-access test
- [x] Added `searchAvailableRooms` tests to `room.test.ts`
- [x] All 185 tests passed
- [x] Typecheck passed

This block is finished.

### Guest Booking Flow ✅

**Completed:** August 5, 2026

- [x] Create a booking as an authenticated guest
- [x] Store `guest_user_id` as the booking owner
- [x] Store `created_by_user_id` as the authenticated actor
- [x] View booking history
- [x] View booking details
- [x] Update booking
- [x] Cancel booking — status set to `cancelled`, cancellation timestamp and actor recorded, booking kept in history, room becomes available again

Testing:

- [x] Guest cancels own confirmed booking
- [x] Booking remains in history as `cancelled`
- [x] Guest cannot cancel another guest's booking (returns 404, scoped by ownership)
- [x] Already-cancelled booking is rejected
- [x] Cancelled booking no longer blocks room availability
- [x] Unauthenticated and non-guest requests are rejected
- [x] All 218 tests and typecheck passed
- [x] Added `docs/api-response-reference.md`, cataloguing every route's success/error responses

This block is finished.

### Current-Module Cleanup ✅

- [x] Move direct SQL from `bookingService` into repositories
- [x] Review other Service modules for direct SQL after their current flows are complete
- [x] Move check-in/check-out ordering rules from Controllers into Services
- [x] Ensure room search and booking creation use the same overlap rule
- [x] Allow same-day turnover by using strict overlap comparisons (`check_in_date < requested_check_out`, `check_out_date > requested_check_in`)

This block is finished.

### Staff Booking Flow ✅

**Completed:** August 5, 2026

- [x] Staff can create a booking for a registered guest
- [x] Staff can create a booking for an unregistered guest
- [x] Staff can update a booking for a registered guest
- [x] Staff can update a booking for an unregistered guest
- [x] Registered guest booking uses `guest_user_id`
- [x] Unregistered guest booking keeps `guest_user_id` null
- [x] Staff ID is stored as `created_by_user_id`

Testing:

- [x] Fixed a `createdByUserId` test bug that compared against the wrong actor's token
- [x] Fixed FK-order cleanup bugs (booking must be deleted before its referenced guest user)
- [x] Staff-created and staff-updated bookings assert `created_by_user_id` against the staff token
- [x] All 220 tests and typecheck passed

This block is finished.

### Ownership and Authorization ✅

**Completed:** August 7, 2026

- [x] Guests access only their own profile
- [x] Guests access only their own bookings
- [x] Staff permissions remain separate from guest ownership
- [x] Authorization and ownership integration tests

Testing:

- [x] Added cross-guest ownership tests: viewing/updating another guest's booking now asserts 404 "Booking not found" (ownership-scoped lookup, not a 403 leak)
- [x] Added guest-blocked-from-staff/admin-routes tests for `GET/POST/PATCH /bookings` and `GET /bookings/:bookingId`
- [x] Tightened `POST /bookings` to `admin`/`staff` only (previously also allowed `guest`, which was inconsistent with the dedicated `/guests/bookings` endpoint and didn't auto-link the booking to the guest)
- [x] Confirmed `/guests/me` (GET/PATCH) is always scoped to the authenticated user's own id with no id route param, so cross-guest profile access isn't reachable by route design
- [x] All 226 tests and typecheck passed

This block is finished.

### Deferred from Guest Journey

- [ ] Shared backend logout
  - Implement only when refresh tokens or server-side sessions exist
- [ ] Swagger documentation for new guest endpoints
  - Add during the Swagger/OpenAPI phase

### Completion Criteria

- [x] Complete customer-facing authentication flow
- [x] Guests can search, create, view, update, and cancel their own bookings
- [x] Ownership rules prevent access to another guest’s data
- [x] Staff-created and guest-created bookings record the correct actor and owner
- [x] No duplicated authentication or booking business logic
- [x] Typecheck passes
- [x] Integration tests pass
- [x] CI remains green

---

## Phase 8 — Payments ✅

**Started:** August 25, 2026  
**Completed:** September 5, 2026

### Completed Workflow

- [x] `POST /guests/bookings/:bookingId/payments`
- [x] Stripe PaymentIntent creation using the trusted booking amount from PostgreSQL
- [x] Payment persistence through migration, repository, service, controller, route, and DTO layers
- [x] Guards for ownership, missing/cancelled bookings, invalid IDs, and incorrect roles
- [x] Verified Stripe webhook with raw-body handling and signature validation
- [x] Successful and failed webhook events update local payment status
- [x] Payment-attempt rules:
  - `succeeded` → reject another payment
  - `pending` → reuse the existing PaymentIntent and payment row
  - `failed` → allow a new PaymentIntent and payment row
  - no existing payment → create the initial attempt

### Reliability and Security

- [x] Trusted server-side pricing; client-supplied payment amounts are not accepted
- [x] Stripe idempotency keys prevent duplicate PaymentIntent creation
- [x] Pending reuse returns the same `clientSecret`
- [x] New payments return `201`; reused pending payments return `200`
- [x] Race-safe persistence uses database conflict handling and reuses the concurrently created row
- [x] Concurrent tests do not assume which request completes first
- [x] Stripe is mocked in automated tests; no live Stripe account or live end-to-end charge is required for the application roadmap

### Verification and Release

- [x] Success, failure, duplicate/concurrent request, webhook update, and invalid-signature tests
- [x] Payment endpoints and response contracts documented in OpenAPI
- [x] Webhook documented as Stripe → backend
- [x] README updated with the implemented payment behavior and test limitation
- [x] Typecheck passed
- [x] All 242 integration tests passed locally
- [x] All 242 integration tests passed inside the rebuilt Docker environment
- [x] WIP merged into `main`
- [x] Final race-condition fix pushed to `main`
- [x] GitHub Actions 2/2 green

### Optional — Must Not Delay Applications

- [ ] **[LATER]** Refund support
- [ ] **[LATER]** More advanced payment reconciliation / background jobs

### Completion Criteria

- [x] Duplicate logical requests do not create duplicate Stripe PaymentIntents
- [x] Pending payment attempts are reused instead of duplicated
- [x] Booking/payment state remains consistent after Stripe final events
- [x] Webhooks are verified securely
- [x] Successful and failed payment flows are both tested
- [x] Payment API is documented
- [x] Typecheck, full tests, Docker verification, and CI are green

---

## Phase 9 — Applications and Final Polish

**Started:** September 5, 2026  
**Status:** Active — applications are now the priority

The technical build is complete, merged, and green. Do not create another technical gate before applying.

### Application Preparation

- [ ] Update resume
- [ ] Clean up GitHub profile
- [ ] Prepare project explanations
- [ ] Prepare architecture explanation
- [ ] Prepare testing and CI/CD explanation
- [ ] Prepare Docker and deployment explanation
- [x] Payments completed, merged into `main`, and verified by CI
- [ ] **[NOW] Begin applications while preparation and polish continue**

### Final Technical Review — During Applications Only

- [ ] Architecture review
- [ ] SQL review
- [ ] Security review
- [ ] API contract review
- [ ] README accuracy review
- [ ] Mock interviews

### Application Priority

1. Osaka product companies
2. International companies
3. English-friendly companies
4. Remote-friendly companies

### Continue During Applications

- [ ] SQL practice
- [ ] Backend system design
- [ ] Algorithms
- [ ] Mock interviews

---

## Later Improvements

Do not delay applications for these items.

### Architecture and Infrastructure

- [ ] Redis
- [ ] Background jobs
- [ ] Metrics
- [ ] Multi-tenancy

### Observability and Operations

- [ ] Structured logging
- [ ] Audit logs

### Product Features

- [ ] Real email service
- [ ] Super Admin

### Developer Experience

- [ ] Validation library

---

## New Backlog Item Format

Add new items under the relevant phase using one of these labels:

```markdown
- [ ] **[NOW]** Required to complete the current feature
- [ ] **[CLEANUP]** Complete after the feature flow, before tests
- [ ] **[LATER]** Useful, but must not delay applications
```

For larger items:

```markdown
- [ ] **[NOW] Task name**
  - Why:
  - Files:
  - Done when:
```

---

## Guiding Principle

Avoid endless cleanup.

Prioritize:

- Complete business workflows
- Correct ownership and security
- Clear architecture
- Testing
- Deployment
- Documentation

Begin applying once the project demonstrates these capabilities. Do not wait for theoretical perfection.
