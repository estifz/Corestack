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

## Current Version

**`v0.1.0`** — Phase 1: Core Foundation

This release contains the reusable backend foundation.

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

Authentication, database integration, storage, queues, and other reusable modules will be introduced in future phases.

---

## Tech Stack

| Technology                                                | Purpose                    |
| --------------------------------------------------------- | -------------------------- |
| [Node.js](https://nodejs.org/)                            | Runtime                    |
| [TypeScript](https://www.typescriptlang.org/)             | Programming Language       |
| [Express](https://expressjs.com/)                         | HTTP Framework             |
| [pnpm](https://pnpm.io/)                                  | Package Manager            |
| [Zod](https://zod.dev/)                                   | Validation & Configuration |
| [Pino](https://getpino.io/)                               | Structured Logging         |
| [Husky](https://typicode.github.io/husky/)                | Git Hooks                  |
| [lint-staged](https://github.com/lint-staged/lint-staged) | Pre-commit Checks          |

---

## Architecture

CoreStack follows a **feature-based architecture** with clear separation between application layers.

### Project Structure

```
src/
├── core/
│   ├── config/
│   ├── errors/
│   ├── logger/
│   ├── middleware/
│   └── ...
│
├── modules/
│   └── <feature>/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── routes/
│       └── validation/
│
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

| [Prisma ORM](https://www.prisma.io/) | PostgreSQL ORM and contract management |
| [PostgreSQL](https://www.postgresql.org/) | Relational Database |

### Environment Variables

Authentication, storage, queues, and other reusable modules will be introduced in future phases.
Create your environment file:

````bash

### Database

- Prisma 8 contract-based PostgreSQL setup
- Typed `User` and `Post` data contract
- Generated contract metadata and TypeScript types
- PostgreSQL readiness check
- Database connection cleanup during shutdown

> **Note:** Environment variables are validated using Zod when the application starts.

### Development

### Prisma and PostgreSQL

The project uses Prisma 8's contract workflow with PostgreSQL. The data contract is defined in
[`src/prisma/contract.prisma`](src/prisma/contract.prisma). It currently contains the `User` and
`Post` models.

Set the database connection string in `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/corestack"
````

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
