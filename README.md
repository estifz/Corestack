# CoreStack

[![npm version](https://img.shields.io/npm/v/create-corestack-app.svg)](https://www.npmjs.com/package/create-corestack-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Tests](https://github.com/estifz/Corestack/actions/workflows/test.yml/badge.svg)](https://github.com/estifz/Corestack/actions)

### Scaffold reusable, production-ready Node.js backends in seconds.

CoreStack is a modular backend foundation and CLI scaffolder for building scalable, secure, and fully-typed REST APIs with **Express 5**, **TypeScript**, configurable databases (**PostgreSQL** or **MongoDB**), authentication, and interactive API documentation.

> **Build the foundation once. Reuse it across projects.**  
> CoreStack is not designed to eliminate engineering decisions - it is designed to eliminate **repetitive engineering work**.

---

## 🚀 Quick Scaffolding

The fastest way to bootstrap a new CoreStack project is via our official CLI:

```bash
# Using pnpm
pnpm create corestack-app my-app

# Using npm
npm create corestack-app@latest my-app

# Using Bun
bun create corestack-app my-app

# Using Yarn
yarn create corestack-app my-app
```

> **Note**: You can omit `my-app` to be prompted for a project name interactively.

The interactive CLI will prompt you to choose your database, toggle authentication, API docs, and Docker setup, or you can use flags for instant generation:

```bash
# Recommended full-stack preset (PostgreSQL + Auth + Docs + Docker)
pnpm create corestack-app my-app --recommended
```

---

## What's Included

- ✓ **Database Support**: Pluggable support for **PostgreSQL** and **MongoDB**.
- ✓ **Authentication & Authorization**: JWT access tokens, refresh cookies, Argon2 hashing, email verification, and password reset flows.
- ✓ **Modular Architecture**: Clean, maintainable feature-based structure with Dependency Injection and Dependency Inversion (DIP).
- ✓ **API Documentation**: Interactive Scalar API reference hosted at `/docs`, raw OpenAPI 3.1 schema at `/openapi.json`, and in-editor requests collection at `docs/requests.http`.
- ✓ **Docker Support**: Ready-to-use Dockerfile and Compose configurations.
- ✓ **Testing & CI Ready**: Self-contained Vitest test suite with HTTP route coverage and automated GitHub Actions CI workflow.

---

## 🏗️ Architecture

CoreStack follows a **feature-based architecture** and the **Dependency Inversion Principle (DIP)**. High-level business logic depends strictly on abstractions rather than concrete database implementations.

### Request Flow

```text
Client  ──►  Route  ──►  Controller  ──►  Service  ──►  Repository Interface
                                                               │
                                                               ▼
                                                    [Prisma / Mongoose]
                                                               │
                                                               ▼
                                                          Database
```

### Layer Responsibilities

- **Route** - Defines endpoints, applies validation and route-level security middlewares.
- **Controller** - Handles HTTP request parsing, response formatting, and status codes.
- **Service** - Encapsulates domain logic, coordinating transactions and external providers (e.g. Resend).
- **Repository Interface** - Defines strict data access contracts.
- **Repository Implementation** - Concrete data source operations (`PrismaAuthRepository`, `MongoAuthRepository`).

### Project Layout

```text
.
├── cli/                  # create-corestack-app CLI generator package
├── docs/                 # In-editor HTTP request collections
├── prisma/               # Prisma 7 schema and standard SQL migrations
├── src/
│   ├── config/           # Validated environment configuration (Zod)
│   ├── core/             # Structured logger (Pino) and graceful shutdown
│   ├── docs/             # OpenAPI 3.1 specification and Scalar route
│   ├── features/         # Feature modules (auth, health, users)
│   │   ├── auth/
│   │   ├── health/
│   │   └── users/
│   ├── middlewares/      # Security, auth, rate limiting, and error handlers
│   ├── mongo/            # MongoDB connection and Mongoose models
│   ├── prisma/           # Prisma client singleton and database adapter
│   ├── types/            # TypeScript error codes and ambient types
│   ├── utils/            # JWT, crypto tokens, and application error classes
│   ├── app.ts            # Express application setup
│   └── server.ts         # Server entrypoint and lifecycle listener
├── test/                 # Vitest unit and HTTP integration tests
├── compose.yaml          # Docker Compose orchestration
└── Dockerfile            # Minimal production container build
```

---

## 🛠️ Development & Contributing

If you are developing or contributing to the CoreStack monorepo directly:

### 1. Prerequisites

- [Node.js](https://nodejs.org/) `>= 20.0.0` (pinned to `24.18.0` in `.tool-versions`)
- [pnpm](https://pnpm.io/) `>= 10.0.0`
- [Docker](https://www.docker.com/) & Docker Compose

### 2. Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/estifz/Corestack.git
cd Corestack
pnpm install
```

Copy the environment variables template:

```bash
cp .env.example .env
```

### 3. Start Database Services (Docker)

Spin up your preferred isolated database service:

```bash
# Start PostgreSQL
pnpm docker:db:postgres

# Apply pending PostgreSQL migrations
pnpm migration:dev

# Or start MongoDB and Mongo Express admin GUI
pnpm docker:db:mongo
```

> **Web GUI**: When running MongoDB, visit `http://localhost:8081` to view and manage collections directly in **Mongo Express**.

### 4. Run Development Server

```bash
pnpm dev
```

The server will start listening at `http://localhost:3000` with interactive documentation at `http://localhost:3000/docs`.

### 5. Running Tests & Quality Checks

```bash
# Run Vitest test suite
pnpm test

# Run TypeScript typechecks
pnpm typecheck

# Check code formatting
pnpm format:check
```

---

## 🔒 Production & Reverse Proxies

By default, CoreStack explicitly sets `app.set('trust proxy', false)` in `src/app.ts` to prevent IP spoofing attacks.

When deploying behind a trusted reverse proxy, cloud load balancer, or container platform (AWS ALB, Nginx, Render, Railway, Fly.io, Cloud Run):

```typescript
// src/app.ts
app.set('trust proxy', 1)
```

This ensures `express-rate-limit` and logging middleware correctly identify real client IPs from the `X-Forwarded-For` header.

---

## Author

- **Estifanos**
    - GitHub: [@estifz](https://github.com/estifz)
    - Email: [kingestiff@gmail.com](mailto:kingestiff@gmail.com)

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## Links

- **GitHub Repository**: [https://github.com/estifz/Corestack](https://github.com/estifz/Corestack)
- **Issue Tracker**: [https://github.com/estifz/Corestack/issues](https://github.com/estifz/Corestack/issues)
- **CLI Package**: [https://www.npmjs.com/package/create-corestack-app](https://www.npmjs.com/package/create-corestack-app)
