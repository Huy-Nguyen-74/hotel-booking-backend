# Osaka Backend Engineer Roadmap

## Current Status — July 30, 2026

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
- ✅ 147 integration tests
- ✅ GitHub Actions CI/CD
- ✅ AWS EC2 + PM2 + systemd deployment
- ✅ Reproducible Docker development environment
- ✅ Automatic development and test database creation
- ✅ Clean-volume Docker verification
- ✅ 147 tests passing inside a fresh Docker environment
- ✅ Docker environment template
- ✅ README and setup documentation

**Current Phase:** Guest Journey  
**Interview Target:** September 2026

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

## Phase 5 — Swagger / OpenAPI

**Target:** July 26–30

### Tasks

- [ ] Install and configure Swagger tooling
- [ ] Expose Swagger UI
- [ ] Define the OpenAPI document
- [ ] Document authentication and JWT usage
- [ ] Document Users endpoints
- [ ] Document Hotels endpoints
- [ ] Document Rooms endpoints
- [ ] Document Bookings endpoints
- [ ] Add request examples
- [ ] Add success response examples
- [ ] Add validation, authentication, authorization, not-found, and conflict errors

### Completion Criteria

- [ ] All important endpoints are documented
- [ ] Protected endpoints support JWT authorization through Swagger UI
- [ ] API requests can be explored without reading the source code
- [ ] Documentation matches actual request and response contracts
- [ ] Type checking, tests, and CI remain green

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

Swagger details will be added to the README after Phase 5 is complete.

---

## Phase 7 — Guest Journey

**Started:** July 28, 2026  
**Target:** August 1–16  
**Status:** In progress

Extend the existing Users and Auth modules with the `guest` role. Do not create a separate authentication system.

### Working Rule

Finish work in this order:

1. Complete the feature flow
2. Resolve current-module cleanup and red lines
3. Run `npm run typecheck`
4. Run `npm test`
5. Commit

Non-blocking cleanup should not interrupt feature implementation.

### Guest Account and Authentication

- [ ] Guest registration -> 8 tests all passed
- [ ] Guest login -> 9 tests all passed, also revised the previous auth tests based on the new Test Framework
- [ ] Guest profile -> done
- [ ] Update guest profile -> done
- [ ] Password reset request -> nearly done
- [ ] Password reset confirmation -> nearly done

### Room Search

- [ ] Search rooms by hotel, type, and price
- [ ] Search room availability by check-in and check-out dates
- [ ] Require both dates when either date is provided
- [ ] Reject invalid date ranges

### Guest Booking Flow

- [ ] Create a booking as an authenticated guest
- [ ] Store `guest_user_id` as the booking owner
- [ ] Store `created_by_user_id` as the authenticated actor
- [ ] View booking history
- [ ] View booking details
- [ ] Update booking
- [ ] Cancel booking

### Staff Booking Flow

- [ ] Staff can create a booking for a registered guest
- [ ] Staff can create a booking for an unregistered guest
- [ ] Staff can update a booking for a registered guest
- [ ] Staff can update a booking for an unregistered guest
- [ ] Registered guest booking uses `guest_user_id`
- [ ] Unregistered guest booking keeps `guest_user_id` null
- [ ] Staff ID is stored as `created_by_user_id`

### Ownership and Authorization

- [ ] Guests access only their own profile
- [ ] Guests access only their own bookings
- [ ] Staff permissions remain separate from guest ownership
- [ ] Authorization and ownership integration tests

### Current-Module Cleanup

Complete these after the Guest Booking flow works, before typecheck and tests:

- [ ] Move direct SQL from `bookingService` into repositories
- [ ] Review other Service modules for direct SQL after their current flows are complete
- [ ] Move check-in/check-out ordering rules from Controllers into Services
- [ ] Ensure room search and booking creation use the same overlap rule
- [ ] Allow same-day turnover by using strict overlap comparisons:
  - Existing `check_in_date < requested_check_out`
  - Existing `check_out_date > requested_check_in`

### Deferred from Guest Journey

- [ ] Shared backend logout
  - Implement only when refresh tokens or server-side sessions exist
- [ ] Swagger documentation for new guest endpoints
  - Add during the Swagger/OpenAPI phase

### Completion Criteria

- [ ] Complete customer-facing authentication flow
- [ ] Guests can search, create, view, update, and cancel their own bookings
- [ ] Ownership rules prevent access to another guest’s data
- [ ] Staff-created and guest-created bookings record the correct actor and owner
- [ ] No duplicated authentication or booking business logic
- [ ] Typecheck passes
- [ ] Integration tests pass
- [ ] CI remains green

---

## Phase 8 — Payments

**Target:** August 17–30

### Core Workflow

- [ ] Stripe test-mode integration
- [ ] Payment intent workflow
- [ ] Payment confirmation
- [ ] Payment persistence
- [ ] Failed payment handling

### Reliability and Security

- [ ] Webhook signature verification
- [ ] Idempotency handling
- [ ] Booking and payment database transaction
- [ ] Prevent duplicate payment creation

### Testing

- [ ] Successful payment integration tests
- [ ] Failed payment integration tests
- [ ] Duplicate request tests
- [ ] Webhook verification tests

### Optional

- [ ] Refund support

### Completion Criteria

- [ ] Duplicate requests do not create duplicate payments
- [ ] Booking and payment state remain consistent
- [ ] Webhooks are verified securely
- [ ] Successful and failed payment flows are tested
- [ ] Typecheck, tests, and CI remain green

---

## Phase 9 — Applications and Final Polish

**Start applications:** August 25  
**Polish target:** August 31–September 6

### Application Preparation

- [ ] Update resume
- [ ] Clean up GitHub profile
- [ ] Prepare project explanations
- [ ] Prepare architecture explanation
- [ ] Prepare testing and CI/CD explanation
- [ ] Prepare Docker and deployment explanation
- [ ] Begin applications while polishing continues

### Final Technical Review

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
