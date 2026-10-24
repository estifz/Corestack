# CoreStack

> A production-oriented TypeScript backend foundation built for maintainability, consistency, and long-term reuse.

CoreStack is a reusable backend foundation for building full-stack and API-driven applications with **Node.js**, **Express**, and **TypeScript**.

The goal is simple:

> **Build the foundation once. Reuse it across projects.**

Instead of rebuilding the same backend infrastructure for every project, CoreStack provides a clean, structured, and extensible starting point while keeping the architecture explicit and understandable.

---

## Philosophy

CoreStack is built around a few core principles:

- **Understandability** — Every part of the system should be easy to understand and explain.
- **Maintainability** — Prefer clear and predictable code over clever abstractions.
- **Separation of Concerns** — Each layer has a clear responsibility.
- **Type Safety** — Use TypeScript to catch problems early.
- **Consistency** — Common problems should have common solutions.
- **Extensibility** — New project-specific functionality should be easy to add.
- **Production-minded** — Security, validation, logging, error handling, and reliability are considered from the beginning.

> CoreStack is not designed to eliminate engineering decisions.
>
> It is designed to eliminate **repetitive engineering work**.

---

## Release History and Project Status

### `v0.1.0` — Phase 1: Core Foundation

Phase 1 established the reusable backend foundation: project setup, feature-based architecture, validation, error handling, logging, security middleware, health checks, graceful shutdown, and development tooling.

### `v0.2.0` — Phase 2: Data Persistence

Phase 2 added the Prisma 8 contract-based PostgreSQL persistence foundation, including the database contract, generated contract artifacts, database readiness checks, and connection cleanup during shutdown.

### `v0.3.0` — Phase 3: Authentication, RBAC, API Documentation & CI

Phase 3 implements an end-to-end, production-grade authentication and user management system, interactive API documentation, and automated CI testing:

- **Authentication & Sessions**: Registration with Argon2 password hashing, credential login, short-lived JWT access tokens via `jose`, stateful session management, cryptographic refresh token rotation with SHA-256 hashing, automatic token reuse detection, HTTP-only secure cookies, and CSRF origin validation (`requireTrustedOrigin`).
- **Email Verification**: Transactional email dispatch via Resend, privacy-preserving anti-enumeration responses, and a safe two-step verification flow (browser landing page + API submission).
- **Password Recovery**: Secure forgot-password flow with one-time tokens and reset-password endpoint that updates credentials and revokes all active sessions.
- **Role-Based Access Control (RBAC) & Users**: Role middleware (`USER`, `ADMIN`), admin-restricted paginated user listing, admin user lookup, and authenticated user profile endpoint (`/api/v1/auth/me`).
- **Interactive Documentation**: Interactive API reference powered by Scalar at `/docs`, full OpenAPI 3.1 schema at `/openapi.json`, and an in-editor HTTP request collection (`docs/requests.http`).
- **Testing & CI Pipeline**: Vitest test suite with Supertest route coverage, mock repository DIP testing, and a GitHub Actions CI workflow running containerized PostgreSQL on push and PR.

### Current Scope

- Project Setup & Tooling (TypeScript, pnpm devEngines, Prettier, Husky, lint-staged)
- Feature-based Architecture & Layer Separation (Routes, Controllers, Services, Repositories)
- Dependency Injection & Inversion (DIP) with clean test mocking
- Request & Environment Validation with Zod
- Centralized Operational & Custom Error Handling
- Structured Logging with Pino
- Security & HTTP Middleware (Helmet, CORS, Rate Limiting, Compression, Trusted Origin)
- Health Checks & Process Liveness (`/health`, `/ready`)
- Graceful Shutdown & Connection Drain
- Prisma 8 Contract-based PostgreSQL Persistence & Migrations
- Authentication & Sessions (Registration, Login, JWTs, Refresh Token Rotation, Logout)
- Email Verification (Resend transactional emails, anti-enumeration, two-step browser confirmation)
- Password Recovery (Forgot & reset password with session revocation)
- Role-Based Access Control (RBAC) & User Management (`USER`, `ADMIN`)
- Interactive API Documentation (Scalar UI & OpenAPI 3.1 specification)
- Automated CI/CD Pipeline (GitHub Actions) & Test Suite (Vitest + Supertest)

Object storage, background queues, and other reusable modules remain future work.

---

## Tech Stack

| Technology                                                | Purpose                                   |
| --------------------------------------------------------- | ----------------------------------------- |
| [Node.js](https://nodejs.org/)                            | Runtime                                   |
| [TypeScript](https://www.typescriptlang.org/)             | Programming Language                      |
| [Express](https://expressjs.com/)                         | HTTP Framework                            |
| [pnpm](https://pnpm.io/)                                  | Package Manager                           |
| [Prisma ORM](https://www.prisma.io/)                      | Prisma 8 contract-based PostgreSQL access |
| [PostgreSQL](https://www.postgresql.org/)                 | Relational database                       |
| [Argon2](https://github.com/ranisalt/node-argon2)         | Password hashing                          |
| [jose](https://github.com/panva/jose)                     | JWT signing and verification              |
| [Resend](https://resend.com/)                             | Transactional email delivery              |
| [Scalar](https://scalar.com/)                             | Interactive OpenAPI documentation UI      |
| [Zod](https://zod.dev/)                                   | Validation & Configuration                |
| [Pino](https://getpino.io/)                               | Structured Logging                        |
| [Vitest](https://vitest.dev/)                             | Unit and integration testing              |
| [Supertest](https://github.com/ladjs/supertest)           | Express HTTP testing                      |
| [Husky](https://typicode.github.io/husky/)                | Git Hooks                                 |
| [lint-staged](https://github.com/lint-staged/lint-staged) | Pre-commit Checks                         |

---

## Architecture

CoreStack follows a **feature-based architecture** with clear separation between application layers.

### Project Structure

```
.
├── .github/
│   └── workflows/        # GitHub Actions CI pipelines
├── docs/                 # In-editor HTTP request collections
├── migrations/           # Prisma 8 migration files & snapshots
├── src/
│   ├── config/           # Validated environment configuration
│   ├── core/             # Core logger and graceful shutdown lifecycle
│   ├── docs/             # OpenAPI 3.1 specification and Scalar route
│   ├── features/         # Feature modules (auth, health, users)
│   │   ├── auth/
│   │   ├── health/
│   │   └── users/
│   ├── infrastructure/   # External integrations (Resend email service)
│   ├── middlewares/      # Security, auth, CORS origin, and error middlewares
│   ├── prisma/           # Database contract, types, and Prisma client
│   ├── types/            # TypeScript ambient types and error codes
│   ├── utils/            # JWT, crypto tokens, and application error classes
│   ├── app.ts            # Express application setup and routing
│   └── server.ts         # Server entry point and port listener
├── test/                 # Vitest unit and HTTP integration tests
├── .dockerignore         # Docker context exclusion rules
├── compose.yaml          # Docker Compose service definition (PostgreSQL & App)
└── Dockerfile            # Multi-stage production container build
```

### Request Flow

```
Client
  ↓
Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Data Source
```

### Layer Responsibilities

- **Route** — Defines the HTTP endpoint and connects it to the appropriate controller.
- **Controller** — Handles HTTP concerns such as requests, responses, and status codes.
- **Service** — Contains business logic and coordinates application operations.
- **Repository** — Handles data access and abstracts the underlying data source.

---

## Dependency Injection & Dependency Inversion

CoreStack uses **Dependency Injection (DI)** and follows the **Dependency Inversion Principle (DIP)**.

```
Service
   ↓
Repository Interface
   ↓
Repository Implementation
   ↓
Data Source
```

High-level application logic depends on abstractions rather than concrete implementations.

This makes components easier to:

- Test
- Replace
- Extend
- Maintain

---

## Included Features

### Project Foundation

- TypeScript Configuration
- pnpm
- Feature-based Architecture
- Development & Production Scripts
- Environment Configuration
- Prettier
- Husky
- lint-staged

### Application Architecture

- Routes
- Controllers
- Services
- Repositories
- Dependency Injection
- Dependency Inversion

### Validation

- Request Validation with Zod
- Environment Variable Validation with Zod
- Centralized Validation Handling

### Error Handling

- Centralized Error Handling
- Custom Application Errors
- Operational Error Handling
- Validation Error Handling
- Unexpected Error Handling
- Consistent Error Responses

### Logging

- Structured Logging with Pino
- Log Levels
- Application Error Logging
- Production-oriented Logging Foundation

### Security & HTTP

- Helmet Security Headers
- Rate Limiting (`express-rate-limit`)
- Trusted Origin Enforcement (`requireTrustedOrigin` for CSRF prevention)
- CORS with Credentials Support
- Response Compression
- JSON & URL-encoded Body Parsing
- Centralized 404 Not Found Handling

### Reliability

- Health Check Endpoints (`/health` process liveness, `/ready` PostgreSQL readiness)
- Graceful Shutdown Handling (SIGINT & SIGTERM)
- Connection Pool Draining & Cleanup

### Authentication & Session Management

- Secure Registration with Argon2 Password Hashing
- Credential Login with Account Status & Email Verification Enforcement
- Short-lived Access Tokens (JWT via `jose`, HS256)
- Stateful Session Management with Request Metadata (IP, User-Agent)
- Cryptographic Refresh Token Rotation with SHA-256 Hashing at Rest
- Automatic Replay / Reuse Attack Detection & Immediate Session Invalidation
- Scoped HTTP-only, SameSite, Secure Cookie Transport
- Secure Logout with Explicit Session Revocation

### Email Verification & Password Recovery

- Transactional Email Dispatch via Resend Integration
- Anti-Enumeration Protections Across Registration, Verification & Recovery
- Safe Two-Step Browser Verification Flow (Interactive Page -> API Submission)
- Resend Verification Link Endpoint
- Secure Forgot-Password Trigger with Cryptographic Reset Tokens
- Password Reset Endpoint with Argon2 Re-hashing and Universal Session Invalidation

### Role-Based Access Control (RBAC) & Users

- Role Hierarchy (`USER`, `ADMIN`)
- Declarative Role Authorization Middleware (`authenticate`, `authorize`)
- Admin-restricted Paginated User Directory (`GET /api/v1/users`)
- Admin-restricted User Profile Lookup by ID (`GET /api/v1/users/:id`)
- Authenticated Current User Profile Endpoint (`GET /api/v1/auth/me`)

### API Documentation

- Interactive OpenAPI Documentation UI via Scalar (`GET /docs`)
- Full OpenAPI 3.1 Specification (`GET /openapi.json`)
- In-Editor HTTP Request Collection (`docs/requests.http`)

### Testing & Continuous Integration

- Vitest Test Runner with Fast Multi-threaded Execution
- Supertest HTTP Endpoint Integration Testing
- Mock Repository Pattern for Decoupled Dependency Inversion Testing
- Automated PostgreSQL Readiness Integration Test
- GitHub Actions CI Workflow Executing Test Suite on Push & Pull Request

### Development Tooling

- Prettier
- Husky
- lint-staged
- ESLint

> **Note:** ESLint is currently postponed due to TypeScript 7 compatibility.

---

## Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) (v22.12 or higher; v24.18 is pinned in `.tool-versions`)
- [pnpm](https://pnpm.io/) (v10 or higher; configured in `devEngines`)
- [PostgreSQL](https://www.postgresql.org/) (v16 or higher, or Docker)
- [Docker](https://www.docker.com/) & Docker Compose _(optional, but recommended)_

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd CoreStack
```

Install dependencies:

```bash
pnpm install
```

### Docker Support

CoreStack includes complete Docker configuration out of the box for both local development and production.

#### Option A: Run PostgreSQL in Docker (Recommended for Local Dev)

Spin up an isolated PostgreSQL 16 container with persistent storage:

```bash
pnpm docker:db
# or
docker compose up -d postgres
```

Apply database migrations:

```bash
pnpm migration:apply
```

Start the application locally with hot-reloading:

```bash
pnpm dev
```

#### Option B: Run Full Stack in Docker (Zero Local Setup)

To build and run both the API and PostgreSQL in isolated containers:

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000` with interactive docs at `http://localhost:3000/docs`.

To stop containers:

```bash
pnpm docker:down
# or
docker compose down
```

### Environment Variables

Create a `.env` file in the project root. Environment variables are validated with Zod when the application starts:

```env
# Server & Runtime
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
API_BASE_URL=http://localhost:3000

# Security & CORS
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_REQUEST=100

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/corestack"

# Authentication & Tokens
JWT_SECRET="replace-with-a-long-random-secret-at-least-32-chars"
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_SECONDS=604800
SESSION_TTL_SECONDS=2592000

# Cookies
REFRESH_COOKIE_NAME=refresh_token
REFRESH_COOKIE_SAME_SITE=lax
REFRESH_COOKIE_SECURE=false

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="CoreStack <no-reply@example.com>"
EMAIL_VERIFICATION_TTL_SECONDS=86400
PASSWORD_RESET_TTL_SECONDS=900
```

`JWT_SECRET` is required. In production, `REFRESH_COOKIE_SECURE` must be `true`; it must also be `true` when `REFRESH_COOKIE_SAME_SITE=none`.

### Authentication

Authentication routes are mounted under `/api/v1/auth`:

- `POST /register` — Validates and registers a new unverified user and dispatches an email verification link.
- `GET /verify-email?token=...` — Serves an interactive HTML confirmation page. Designed to prevent email scanner pre-fetch from invalidating the token. The user confirms by clicking the button, which posts to `/verify-email`.
- `POST /verify-email` — Consumes the verification token and activates the user account for sign-in.
- `POST /resend-verification` — Accepts `{ "email": "..." }` and dispatches a fresh verification token. Returns an anti-enumeration response (does not leak account existence).
- `POST /login` — Verifies credentials, verifies active and verified status, generates a session, and returns a short-lived access JWT. Sends a rotating refresh token in an HTTP-only cookie.
- `POST /refresh` — Validates and rotates the refresh token cookie, issuing a replacement cookie and fresh access token. Requires a trusted `Origin` in `CORS_ORIGINS`. Automatically revokes sessions if token reuse is detected.
- `POST /logout` — Revokes the active session associated with the refresh token cookie and clears the cookie. Requires a trusted `Origin`.
- `POST /forgot-password` — Accepts `{ "email": "..." }` and generates a single-use password reset token dispatched via Resend. Returns an anti-enumeration response.
- `POST /reset-password` — Accepts `{ "token": "...", "password": "..." }`, validates the reset token, updates password with Argon2 hashing, and revokes all active sessions for that user.
- `GET /me` — Returns the authenticated user's profile (`id`, `email`, `role`, `createdAt`). Protected by `Authorization: Bearer <access-token>`.

### Users & Administration

User management routes are mounted under `/api/v1/users`:

- `GET /api/v1/users` — Returns a paginated list of all registered users and total count (`?limit=20&offset=0`). **Protected: Requires `ADMIN` role.**
- `GET /api/v1/users/:id` — Retrieves an individual user profile by ID (excludes password hashes). **Protected: Requires `ADMIN` role.**

### API Documentation

Interactive API documentation is powered by **Scalar** and available out of the box:

- **Interactive UI**: `GET /docs` — Live interactive API reference with light/dark theme, instant request tester, and generated code snippets (JavaScript, Python, cURL, etc.).
- **OpenAPI 3.1 Spec**: `GET /openapi.json` — Raw JSON specification for importing into Postman, Insomnia, or generating frontend SDKs.
- **In-Editor Requests**: [`docs/requests.http`](docs/requests.http) — Pre-configured request collection for testing endpoints directly in VS Code (REST Client), JetBrains HTTP Client, or Bruno.

### Database

- Prisma 8 contract-based PostgreSQL setup.
- The auth contract defines `User`, `Session`, `RefreshToken`, `EmailVerificationToken`, and `PasswordResetToken` models.
- Generated contract metadata and TypeScript types are checked in.
- PostgreSQL readiness check and database connection cleanup during shutdown.

The contract is defined in [`src/prisma/contract.prisma`](src/prisma/contract.prisma).

### Prisma and PostgreSQL

The project uses Prisma 8's contract workflow with PostgreSQL. Environment variables are validated with Zod at startup.

After changing the contract, regenerate the checked-in contract artifacts:

```bash
pnpm contract:emit
# or
pnpm prisma contract emit
```

This updates:

- `src/prisma/contract.json` — runtime contract metadata
- `src/prisma/contract.d.ts` — generated TypeScript contract types

Database migration commands:

```bash
# Plan a new migration
pnpm migration:plan -- <migration_name>

# Apply pending migrations to the database
pnpm migration:apply

# Check current migration status
pnpm migration:status

# Inspect applied migrations
pnpm migration:show
```

The application database client is exported from [`src/prisma/db.ts`](src/prisma/db.ts). Use this client from repositories and services rather than creating a separate Prisma client instance.

The health endpoints are:

```text
GET /health  # process liveness
GET /ready   # PostgreSQL readiness
```

`/ready` executes `SELECT 1` against PostgreSQL and returns `503` when the database is unavailable.
On `SIGINT` or `SIGTERM`, the server stops accepting requests, closes the HTTP server, and closes
the PostgreSQL connection.

Start the development server:

```bash
pnpm dev
```

### Tests

Run the unit and HTTP tests with:

```bash
pnpm test
```

For the PostgreSQL readiness integration test, set `TEST_DATABASE_URL` to a dedicated test database URL before running the suite. The integration test only runs a read-only readiness query and closes its Prisma client when finished. Watch tests during development with `pnpm test:watch`.

Vitest 5 requires Node.js 22.12 or later; this repository pins Node.js 24.18 in `.tool-versions`.

### Production

Build the application:

```bash
pnpm build
```

Start the production build:

```bash
pnpm start
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

Please make sure your changes follow the project's coding standards and include relevant tests where applicable.

## License

This project is licensed under the [MIT License](LICENSE).
