# CoreStack

> A production-oriented TypeScript backend foundation built for maintainability, consistency, and long-term reuse.

CoreStack is a reusable backend foundation for building full-stack and API-driven applications with **Node.js**, **Express**, and **TypeScript**.

The goal is simple:

> **Build the foundation once. Reuse it across projects.**

Instead of rebuilding the same backend infrastructure for every project, CoreStack provides a clean, structured, and extensible starting point while keeping the architecture explicit and understandable.

---

## Philosophy

CoreStack is built around a few core principles:

- **Understandability** - Every part of the system should be easy to understand and explain.
- **Maintainability** - Prefer clear and predictable code over clever abstractions.
- **Separation of Concerns** - Each layer has a clear responsibility.
- **Type Safety** - Use TypeScript to catch problems early.
- **Consistency** - Common problems should have common solutions.
- **Extensibility** - New project-specific functionality should be easy to add.
- **Production-minded** - Security, validation, logging, error handling, and reliability are considered from the beginning.

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
- **Containerization & Docker**: Multi-stage production Dockerfile (Alpine-based, BuildKit caching, lean ~109 MB content size) and Docker Compose orchestration for PostgreSQL, MongoDB, and App.
- **Testing & CI Pipeline**: Vitest test suite with Supertest route coverage, mock repository DIP testing, and a lightweight GitHub Actions CI workflow running tests on push and PR.

### `v0.4.0` — Phase 4: Pluggable Multi-Database Architecture (MongoDB & Mongoose)

Phase 4 introduces pluggable multi-database support to CoreStack, allowing developers to choose between **PostgreSQL (Prisma 7)** and **MongoDB (Mongoose)** without affecting business logic:

- **Pluggable Architecture**: Runtime database switching via `DATABASE_PROVIDER=postgres | mongodb`.
- **Decoupled Repositories**: Complete MongoDB repository implementations (`MongoAuthRepository`, `MongoUserRepository`) satisfying the exact same abstract repository contracts.
- **Mongoose Data Models**: Strict schemas matching the Prisma schema 1:1 (`User`, `Session`, `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken`) with automatic indexing on startup.
- **Temporal API Compatibility**: Seamless bi-directional translation between domain `Temporal.Instant` timestamps and MongoDB BSON `Date` storage.
- **Docker & Web GUI**: Added MongoDB 7.0 container with persistent volumes and **Mongo Express** browser-based administration UI at `http://localhost:8081`.
- **Adaptive Lifecycle**: Dynamic `/ready` health check and graceful shutdown connection draining for whichever database is active.

### Roadmap & Scope

CoreStack currently covers the complete core foundation: modular feature architecture, security middleware, authentication with session rotation, RBAC, API documentation, pluggable PostgreSQL & MongoDB persistence, Docker orchestration, and automated CI testing.

Future modules planned for CoreStack:

- **Object Storage**: S3-compatible cloud storage adapter (AWS S3, Cloudflare R2, MinIO).
- **Background Jobs & Queues**: Asynchronous worker processing (BullMQ / Redis).
- **CLI Scaffolding Tool**: Interactive project generator (`corestack create`) for custom stack selection.

---

## Tech Stack

| Technology                                                      | Purpose                                     |
| --------------------------------------------------------------- | ------------------------------------------- |
| [Node.js](https://nodejs.org/)                                  | Runtime                                     |
| [TypeScript](https://www.typescriptlang.org/)                   | Programming Language                        |
| [Express](https://expressjs.com/)                               | HTTP Framework                              |
| [pnpm](https://pnpm.io/)                                        | Package Manager                             |
| [Prisma ORM](https://www.prisma.io/)                            | Prisma 7 PostgreSQL ORM with driver adapter |
| [PostgreSQL](https://www.postgresql.org/)                       | Relational database                         |
| [MongoDB](https://www.mongodb.com/)                             | Document-based database                     |
| [Mongoose](https://mongoosejs.com/)                             | MongoDB Object Data Modeling (ODM)          |
| [Mongo Express](https://github.com/mongo-express/mongo-express) | Web-based MongoDB administration GUI        |
| [Argon2](https://github.com/ranisalt/node-argon2)               | Password hashing                            |
| [jose](https://github.com/panva/jose)                           | JWT signing and verification                |
| [Resend](https://resend.com/)                                   | Transactional email delivery                |
| [Scalar](https://scalar.com/)                                   | Interactive OpenAPI documentation UI        |
| [Zod](https://zod.dev/)                                         | Validation & Configuration                  |
| [Pino](https://getpino.io/)                                     | Structured Logging                          |
| [Vitest](https://vitest.dev/)                                   | Unit and integration testing                |
| [Supertest](https://github.com/ladjs/supertest)                 | Express HTTP testing                        |
| [Docker](https://www.docker.com/)                               | Containerization & service orchestration    |
| [Husky](https://typicode.github.io/husky/)                      | Git Hooks                                   |
| [lint-staged](https://github.com/lint-staged/lint-staged)       | Pre-commit Checks                           |

---

## Architecture

CoreStack follows a **feature-based architecture** with clear separation between application layers.

### Project Structure

```
.
├── .github/
│   └── workflows/        # GitHub Actions CI pipelines
├── docs/                 # In-editor HTTP request collections
├── prisma/               # Prisma 7 schema and standard SQL migrations
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
│   ├── mongo/            # MongoDB connection, lifecycle, and Mongoose models
│   ├── prisma/           # Database client singleton and adapter connection
│   ├── types/            # TypeScript ambient types and error codes
│   ├── utils/            # JWT, crypto tokens, and application error classes
│   ├── app.ts            # Express application setup and routing
│   └── server.ts         # Server entry point and port listener
├── test/                 # Vitest unit and HTTP integration tests
├── .dockerignore         # Docker context exclusion rules
├── compose.yaml          # Docker Compose (PostgreSQL, MongoDB, Mongo Express, App)
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

## Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) (v22.12 or higher; v24.18 is pinned in `.tool-versions`)
- [pnpm](https://pnpm.io/) (v10 or higher; configured in `devEngines`)
- [PostgreSQL](https://www.postgresql.org/) (v16 or higher, or Docker) _(when using PostgreSQL provider)_
- [MongoDB](https://www.mongodb.com/) (v7.0 or higher, or Docker) _(when using MongoDB provider)_
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

#### Option A: Run Databases in Docker (Recommended for Local Dev)

Spin up your chosen isolated database container with persistent storage:

```bash
# Start PostgreSQL (port 5432)
pnpm docker:db:postgres

# Start MongoDB (port 27017) and Mongo Express Web GUI (port 8081)
pnpm docker:db:mongo

# Or start both simultaneously
pnpm docker:db:all
```

> **Web GUI**: When running MongoDB, visit **`http://localhost:8081`** in your browser to access the **Mongo Express** interface for viewing and managing documents directly.

If using PostgreSQL, apply pending migrations:

```bash
pnpm migration:dev
# or in production:
pnpm migration:deploy
```

_(MongoDB requires zero migrations; collections and indexes are initialized automatically)._

Start the application locally with hot-reloading:

```bash
pnpm dev
```

#### Option B: Run Full Stack in Docker (Zero Local Setup)

To build and run the API along with database services in isolated containers:

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

# Database Provider ('postgres' | 'mongodb')
DATABASE_PROVIDER=postgres

# PostgreSQL Connection (used when DATABASE_PROVIDER=postgres)
DATABASE_URL="postgresql://postgres:password@localhost:5432/corestack"

# MongoDB Connection (used when DATABASE_PROVIDER=mongodb)
MONGODB_URI="mongodb://localhost:27017/corestack"

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

### Database & Persistence

CoreStack features a **pluggable database architecture** supporting both **PostgreSQL** and **MongoDB**. You can choose your preferred provider in `.env`:

```env
DATABASE_PROVIDER=postgres # or 'mongodb'
```

Both providers implement identical contracts for `AuthRepository` and `UserRepository`. Services and controllers remain completely database-agnostic.

#### 1. PostgreSQL & Prisma 7

The PostgreSQL path uses Prisma 7 with declarative schemas, PostgreSQL driver adapter (`@prisma/adapter-pg`), and standard migrations:

- **Schema Definition**: [`prisma/schema.prisma`](prisma/schema.prisma)
- **Database Client**: Exported from [`src/prisma/db.ts`](src/prisma/db.ts)

After editing the Prisma schema, generate the TypeScript client:

```bash
pnpm db:generate
```

Database migration commands:

```bash
# Create and apply a new migration in development
pnpm migration:dev

# Apply pending migrations in production or CI
pnpm migration:deploy

# Check current migration status
pnpm migration:status
```

#### 2. MongoDB & Mongoose

The MongoDB path uses Mongoose with schemas matching the Prisma schema 1:1:

- **Database Client & Lifecycle**: Exported from [`src/mongo/db.ts`](src/mongo/db.ts)
- **Mongoose Models**: Located in [`src/mongo/models/`](src/mongo/models/) (`User`, `Session`, `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken`)
- **Zero-Migration Setup**: Collections and indexes (such as unique constraints on `email` and `tokenHash`) are initialized automatically by Mongoose upon application boot.
- **Web Administration**: Visit **`http://localhost:8081`** when running Docker to access the **Mongo Express** GUI.

#### Health Checks & Lifecycle

```text
GET /health  # process liveness
GET /ready   # database readiness (PostgreSQL SELECT 1 or MongoDB admin ping)
```

`/ready` dynamically verifies connectivity for whichever database provider is active:

- When using PostgreSQL, it executes `SELECT 1`.
- When using MongoDB, it runs `db.admin().ping()`.

On `SIGINT` or `SIGTERM`, graceful shutdown closes the HTTP server and cleanly drains database connections for the active provider.

### Tests

Run the unit and HTTP tests with:

```bash
pnpm test
```

The test suite is completely self-contained and runs in-memory using repository mocks and dependency inversion, requiring no running database instances. Watch tests during development with `pnpm test:watch`.

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
