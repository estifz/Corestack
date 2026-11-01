import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from '../types.js'
import { getRunCommand } from '../utils/pm.js'

export function transformReadme(config: ProjectConfig): void {
    const root = config.projectPath
    const isPostgres = config.databaseProvider === 'postgres'
    const pm = config.packageManager

    const runDev = getRunCommand(pm, 'dev')
    const runTest = getRunCommand(pm, 'test')
    const runBuild = getRunCommand(pm, 'build')
    const runFormat = getRunCommand(pm, 'format')
    const runMigrate = getRunCommand(pm, 'migration:dev')

    let content = `# ${config.projectName}

> A production-oriented TypeScript backend built with CoreStack.

## Features

- **Runtime & Language**: Node.js, Express, TypeScript
- **Database**: ${isPostgres ? 'PostgreSQL with Prisma 7 ORM' : 'MongoDB with Mongoose ODM'}
- **Validation & Environment**: Zod schema validation
- **Logging**: High-performance structured logging with Pino
`

    if (config.includeAuth) {
        content += `- **Authentication & RBAC**: Argon2 hashing, stateful session store, cryptographic refresh token rotation, Resend email verification, and role-based access control\n`
    }
    if (config.includeDocs) {
        content += `- **API Documentation**: Interactive Scalar API reference at \`/docs\` and OpenAPI 3.1 schema at \`/openapi.json\`\n`
    }
    if (config.includeDocker) {
        content += `- **Containerization**: Minimal production Dockerfile and Docker Compose orchestration\n`
    }

    content += `- **Testing & Quality**: Vitest suite with Supertest, Prettier, and Husky pre-commit hooks

---

## Getting Started

### 1. Environment Configuration

Copy the example environment file:

\`\`\`bash
cp .env.example .env
\`\`\`
`

    if (config.includeAuth) {
        content += `> [!IMPORTANT]
> Make sure to update \`JWT_SECRET\` and \`RESEND_API_KEY\` in your \`.env\` file before production deployment.
\n`
    }

    content += `### 2. Database Setup

`

    if (isPostgres) {
        if (config.includeDocker) {
            content += `Start the PostgreSQL container:

\`\`\`bash
docker compose up -d postgres
\`\`\`

`
        }
        content += `Apply database migrations:

\`\`\`bash
${runMigrate}
\`\`\`
`
    } else {
        if (config.includeDocker) {
            content += `Start MongoDB and Mongo Express administration UI:

\`\`\`bash
docker compose up -d mongodb mongo-express
\`\`\`

Mongo Express web GUI will be available at \`http://localhost:8081\`.
`
        }
    }

    content += `
### 3. Start Development Server

\`\`\`bash
${runDev}
\`\`\`

The server will start listening at \`http://localhost:3000\`.

---

## Available Scripts

| Command | Description |
| --- | --- |
| \`${runDev}\` | Start development server with live reload |
| \`${runBuild}\` | Compile TypeScript to \`dist/\` |
| \`${runTest}\` | Run Vitest test suite |
| \`${runFormat}\` | Format codebase with Prettier |
`

    if (isPostgres) {
        content += `| \`${runMigrate}\` | Run Prisma migrations in development |\n`
        content += `| \`${getRunCommand(pm, 'db:generate')}\` | Generate Prisma client |\n`
    }

    if (config.includeDocker) {
        content += `| \`${getRunCommand(pm, 'docker:up')}\` | Start all containers in background |\n`
        content += `| \`${getRunCommand(pm, 'docker:down')}\` | Stop all containers |\n`
    }

    content += `
---

## Key Endpoints

- \`GET /health\` — Health and liveness check
- \`GET /ready\` — Database connectivity readiness check
`

    if (config.includeDocs) {
        content += `- \`GET /docs\` — Interactive Scalar API Reference\n- \`GET /openapi.json\` — OpenAPI 3.1 specification\n`
    }

    if (config.includeAuth) {
        content += `- \`POST /api/v1/auth/register\` — Register new user account
- \`POST /api/v1/auth/login\` — User login & session creation
- \`POST /api/v1/auth/refresh\` — Rotate access & refresh tokens
- \`POST /api/v1/auth/logout\` — Revoke active session
- \`GET /api/v1/auth/me\` — Authenticated user profile
- \`GET /api/v1/users\` — Paginated user directory (Admin restricted)
`
    }

    content += `
---

## Security & Reverse Proxies (\`trust proxy\`)

By default, \`app.set('trust proxy', false)\` is configured in \`src/app.ts\` to prevent IP spoofing when exposed directly to the internet.

If you deploy behind a reverse proxy or cloud platform (Nginx, Cloudflare, AWS ALB, Render, Railway, Fly.io, Cloud Run), update \`src/app.ts\` to trust your proxy hop:

\`\`\`typescript
// Trust the first reverse proxy hop
app.set('trust proxy', 1)
\`\`\`
`

    fs.writeFileSync(path.join(root, 'README.md'), content, 'utf-8')
}
