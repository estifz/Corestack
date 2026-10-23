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

### Current Scope

- Project Setup
- Feature-based Architecture
- Dependency Injection & Inversion
- Validation
- Error Handling
- Logging
- Security Middleware
- Health Checks
- Graceful Shutdown
- Development Tooling
- Authentication (registration, login, access tokens, refresh-token rotation, logout)
- Prisma 8 contract-based PostgreSQL persistence

Storage, queues, and other reusable modules remain future work.

---

## Tech Stack

| Technology                                                | Purpose                                   |
| --------------------------------------------------------- | ----------------------------------------- |
| [Node.js](https://nodejs.org/)                            | Runtime                                   |
| [TypeScript](https://www.typescriptlang.org/)             | Programming Language                      |
| [Express](https://expressjs.com/)                         | HTTP Framework                            |
| [pnpm](https://pnpm.io/)                                  | Package Manager                           |
| [Zod](https://zod.dev/)                                   | Validation & Configuration                |
| [Pino](https://getpino.io/)                               | Structured Logging                        |
| [Husky](https://typicode.github.io/husky/)                | Git Hooks                                 |
| [lint-staged](https://github.com/lint-staged/lint-staged) | Pre-commit Checks                         |
| [Prisma ORM](https://www.prisma.io/)                      | Prisma 8 contract-based PostgreSQL access |
| [PostgreSQL](https://www.postgresql.org/)                 | Relational database                       |
| [Vitest](https://vitest.dev/)                             | Unit and integration testing              |
| [Supertest](https://github.com/ladjs/supertest)           | Express HTTP testing                      |

---

## Architecture

CoreStack follows a **feature-based architecture** with clear separation between application layers.

### Project Structure

```
src/
├── config/
├── core/
├── features/
│   ├── auth/
│   ├── health/
│   └── users/
├── middlewares/
├── prisma/
├── utils/
└── server.ts
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

- Helmet
- Rate Limiting
- Response Compression
- JSON Body Parsing
- URL-encoded Body Parsing

### Reliability

- Health Check Endpoints
- Graceful Shutdown
- SIGINT Handling
- SIGTERM Handling

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

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/)

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

- `POST /register` validates and creates an unverified user and emails a verification link;

- `GET /verify-email?token=...` serves a confirmation page. It does not verify the address; the user must click the page's button, which submits the token via `POST /verify-email`.

- `POST /resend-verification` accepts `{ "email": "..." }` and sends a fresh link when the account exists and is unverified. Its response does not disclose account existence.
- `POST /login` verifies credentials, checks that the account is active and email-verified, creates a session, and returns an access token. The refresh token is sent in an HTTP-only cookie.
- `POST /refresh` rotates the refresh token and returns a new access token. It requires a trusted `Origin` configured in `CORS_ORIGINS`.
- `POST /logout` revokes the session represented by the refresh cookie and clears the cookie. It also requires a trusted `Origin`.
- `GET /me` returns the current user and requires `Authorization: Bearer <access-token>`.

### Users & Administration

User management routes are mounted under `/users`:

- `GET /users` — Returns a paginated list of all registered users and the total count (`?limit=20&offset=0`). **Protected: Requires `ADMIN` role.**
- `GET /users/:id` — Retrieves a user profile by ID (excludes password hashes). **Protected: Requires `ADMIN` role.**

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
pnpm prisma contract emit
```

This updates:

- `src/prisma/contract.json` — runtime contract metadata
- `src/prisma/contract.d.ts` — generated TypeScript contract types

The application database client is exported from
[`src/prisma/db.ts`](src/prisma/db.ts). Use this client from repositories and services rather than
creating a separate Prisma client instance.

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
