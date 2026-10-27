# create-corestack

> Interactive CLI tool to scaffold production-ready TypeScript backends powered by [CoreStack](https://github.com/estifz/Corestack).

---

## Quick Start

Create a new CoreStack project with one command:

```bash
# Using npm / npx
npx create-corestack

# Using pnpm
pnpm create corestack

# Using bun
bun create corestack

# Using yarn
yarn create corestack
```

---

## Setup Modes

### 1. Recommended Setup (Zero Friction)

Scaffolds the full production-ready battery in seconds:

- **TypeScript** (Strict mode)
- **PostgreSQL** with Prisma 8 contract persistence
- **Complete Authentication & RBAC** (Argon2, JWT session rotation, token reuse detection, Resend email verification, password reset)
- **Interactive Documentation** (Scalar OpenAPI 3.1 at `/docs`)
- **Docker Compose** orchestration
- Automatic Git initialization & dependency installation

### 2. Custom Setup

Customize each layer to match your stack requirements:

- **Database**: PostgreSQL (Prisma 8) or MongoDB (Mongoose)
- **Auth & RBAC**: Include full auth suite or minimal API skeleton
- **Interactive API Documentation**: Scalar OpenAPI 3.1 (Yes / No)
- **Docker Orchestration**: Dockerfile & Compose (Yes / No)
- **Package Manager**: pnpm, npm, yarn, bun

---

## Non-Interactive & CI Flags

You can bypass the interactive questionnaire entirely by passing CLI flags:

```bash
# Recommended defaults in a folder named my-api
npx create-corestack my-api -y

# MongoDB custom stack without auth
npx create-corestack my-mongo-api --db mongodb --no-auth --docs --docker --pm pnpm
```

### Options Reference:

| Flag                          | Description                        | Choices / Default                  |
| ----------------------------- | ---------------------------------- | ---------------------------------- |
| `[project-name]`              | Target directory name              | `my-app`                           |
| `-d, --database, --db`        | Persistence engine                 | `postgres` \| `mongodb`            |
| `--auth` / `--no-auth`        | Authentication & RBAC              | Default: `true`                    |
| `--docs` / `--no-docs`        | Scalar OpenAPI documentation       | Default: `true`                    |
| `--docker` / `--no-docker`    | Dockerfile & compose orchestration | Default: `true`                    |
| `-p, --package-manager, --pm` | Package manager                    | `pnpm` \| `npm` \| `yarn` \| `bun` |
| `--git` / `--no-git`          | Git repository initialization      | Default: `true`                    |
| `--install` / `--no-install`  | Install dependencies               | Default: `true`                    |
| `-y, --yes`                   | Scaffold with recommended defaults | —                                  |
| `-v, --version`               | Output CLI version                 | —                                  |
| `-h, --help`                  | Display help screen                | —                                  |

---

## License

ISC
