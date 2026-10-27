import path from 'node:path'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { generateProject } from '../src/generator/index.js'
import type { ProjectConfig } from '../src/types.js'

const TEST_DIR = path.resolve(process.cwd(), '.tmp-test-scenarios')

describe('create-corestack generator', () => {
    beforeEach(async () => {
        await fs.ensureDir(TEST_DIR)
    })

    afterEach(async () => {
        await fs.remove(TEST_DIR)
    })

    it('Scenario 1: Recommended Setup (PostgreSQL + Auth + Docs + Docker + pnpm)', async () => {
        const targetDir = path.join(TEST_DIR, 'rec-app')
        const config: ProjectConfig = {
            projectName: 'rec-app',
            targetDir,
            database: 'postgres',
            auth: true,
            docs: true,
            docker: true,
            packageManager: 'pnpm',
            git: true,
            install: false,
        }

        await generateProject(config)

        // Verify directory and files
        expect(await fs.pathExists(path.join(targetDir, 'src/prisma'))).toBe(
            true,
        )
        expect(await fs.pathExists(path.join(targetDir, 'src/mongo'))).toBe(
            false,
        )
        expect(
            await fs.pathExists(
                path.join(
                    targetDir,
                    'src/features/auth/mongo-auth.repository.ts',
                ),
            ),
        ).toBe(false)
        expect(
            await fs.pathExists(
                path.join(
                    targetDir,
                    'src/features/auth/prisma-auth.repository.ts',
                ),
            ),
        ).toBe(true)
        expect(
            await fs.pathExists(path.join(targetDir, 'src/features/auth')),
        ).toBe(true)
        expect(
            await fs.pathExists(path.join(targetDir, 'src/features/users')),
        ).toBe(true)
        expect(await fs.pathExists(path.join(targetDir, 'src/docs'))).toBe(true)
        expect(await fs.pathExists(path.join(targetDir, 'Dockerfile'))).toBe(
            true,
        )
        expect(await fs.pathExists(path.join(targetDir, 'compose.yaml'))).toBe(
            true,
        )
        expect(await fs.pathExists(path.join(targetDir, '.git'))).toBe(true)
        expect(await fs.pathExists(path.join(targetDir, '.gitignore'))).toBe(
            true,
        )

        // Verify compose.yaml
        const compose = await fs.readFile(
            path.join(targetDir, 'compose.yaml'),
            'utf-8',
        )
        expect(compose).toContain('postgres:')
        expect(compose).not.toContain('mongodb:')
        expect(compose).not.toContain('mongo-express:')

        // Verify .env and .env.example
        const env = await fs.readFile(path.join(targetDir, '.env'), 'utf-8')
        expect(env).toContain('DATABASE_URL=')
        expect(env).not.toContain('MONGODB_URI=')
        expect(env).not.toContain('DATABASE_PROVIDER=')
        expect(env).toContain('JWT_SECRET=')

        // Verify package.json
        const pkg = await fs.readJson(path.join(targetDir, 'package.json'))
        expect(pkg.name).toBe('rec-app')
        expect(pkg.dependencies['@prisma/orm-postgres']).toBeDefined()
        expect(pkg.dependencies['mongoose']).toBeUndefined()
        expect(pkg.dependencies['argon2']).toBeDefined()
        expect(pkg.dependencies['@scalar/express-api-reference']).toBeDefined()
        expect(pkg.scripts['migration:apply']).toBeDefined()
        expect(pkg.scripts['docker:db:postgres']).toBeDefined()
        expect(pkg.scripts['docker:db:mongo']).toBeUndefined()

        // Verify app.ts
        const appTs = await fs.readFile(
            path.join(targetDir, 'src/app.ts'),
            'utf-8',
        )
        expect(appTs).toContain('/api/v1/auth')
        expect(appTs).toContain('/api/v1/users')
        expect(appTs).toContain('docsRoutes')

        // Verify server.ts
        const serverTs = await fs.readFile(
            path.join(targetDir, 'src/server.ts'),
            'utf-8',
        )
        expect(serverTs).toContain('[provider: postgres]')
        expect(serverTs).not.toContain('mongoDb.connect')
    })

    it('Scenario 2: Custom MongoDB (MongoDB + Auth + Docs + Docker + pnpm)', async () => {
        const targetDir = path.join(TEST_DIR, 'mongo-app')
        const config: ProjectConfig = {
            projectName: 'mongo-app',
            targetDir,
            database: 'mongodb',
            auth: true,
            docs: true,
            docker: true,
            packageManager: 'pnpm',
            git: true,
            install: false,
        }

        await generateProject(config)

        // Verify directory and files
        expect(await fs.pathExists(path.join(targetDir, 'src/mongo'))).toBe(
            true,
        )
        expect(await fs.pathExists(path.join(targetDir, 'src/prisma'))).toBe(
            false,
        )
        expect(await fs.pathExists(path.join(targetDir, 'migrations'))).toBe(
            false,
        )
        expect(
            await fs.pathExists(path.join(targetDir, 'prisma.config.ts')),
        ).toBe(false)
        expect(
            await fs.pathExists(
                path.join(
                    targetDir,
                    'src/features/auth/prisma-auth.repository.ts',
                ),
            ),
        ).toBe(false)
        expect(
            await fs.pathExists(
                path.join(
                    targetDir,
                    'src/features/auth/mongo-auth.repository.ts',
                ),
            ),
        ).toBe(true)
        expect(
            await fs.pathExists(
                path.join(
                    targetDir,
                    'test/prisma/readiness.integration.test.ts',
                ),
            ),
        ).toBe(false)

        // Verify compose.yaml
        const compose = await fs.readFile(
            path.join(targetDir, 'compose.yaml'),
            'utf-8',
        )
        expect(compose).toContain('mongodb:')
        expect(compose).toContain('mongo-express:')
        expect(compose).not.toContain('postgres:')

        // Verify .env
        const env = await fs.readFile(path.join(targetDir, '.env'), 'utf-8')
        expect(env).toContain('MONGODB_URI=')
        expect(env).not.toContain('DATABASE_URL=')
        expect(env).not.toContain('DATABASE_PROVIDER=')

        // Verify package.json
        const pkg = await fs.readJson(path.join(targetDir, 'package.json'))
        expect(pkg.name).toBe('mongo-app')
        expect(pkg.dependencies['mongoose']).toBeDefined()
        expect(pkg.dependencies['@prisma/orm-postgres']).toBeUndefined()
        expect(pkg.devDependencies['prisma']).toBeUndefined()
        expect(pkg.scripts['migration:apply']).toBeUndefined()
        expect(pkg.scripts['docker:db:mongo']).toBeDefined()
        expect(pkg.scripts['docker:db:postgres']).toBeUndefined()

        // Verify server.ts
        const serverTs = await fs.readFile(
            path.join(targetDir, 'src/server.ts'),
            'utf-8',
        )
        expect(serverTs).toContain('[provider: mongodb]')
        expect(serverTs).toContain('mongoDb.connect()')
        expect(serverTs).not.toContain('./prisma/db.js')
    })

    it('Scenario 3: Custom No-Auth (PostgreSQL + No Auth + Docs + Docker)', async () => {
        const targetDir = path.join(TEST_DIR, 'no-auth-app')
        const config: ProjectConfig = {
            projectName: 'no-auth-app',
            targetDir,
            database: 'postgres',
            auth: false,
            docs: true,
            docker: true,
            packageManager: 'pnpm',
            git: true,
            install: false,
        }

        await generateProject(config)

        // Auth files pruned
        expect(
            await fs.pathExists(path.join(targetDir, 'src/features/auth')),
        ).toBe(false)
        expect(
            await fs.pathExists(path.join(targetDir, 'src/features/users')),
        ).toBe(false)
        expect(
            await fs.pathExists(path.join(targetDir, 'src/infrastructure')),
        ).toBe(false)
        expect(
            await fs.pathExists(
                path.join(targetDir, 'src/middlewares/auth.middleware.ts'),
            ),
        ).toBe(false)
        expect(
            await fs.pathExists(
                path.join(targetDir, 'src/middlewares/requireTrustedOrigin.ts'),
            ),
        ).toBe(false)
        expect(
            await fs.pathExists(path.join(targetDir, 'src/utils/jwt.ts')),
        ).toBe(false)
        expect(
            await fs.pathExists(path.join(targetDir, 'src/utils/token.ts')),
        ).toBe(false)

        // Auth tests pruned
        expect(
            await fs.pathExists(
                path.join(targetDir, 'test/features/auth.service.test.ts'),
            ),
        ).toBe(false)
        expect(
            await fs.pathExists(
                path.join(targetDir, 'test/features/user.service.test.ts'),
            ),
        ).toBe(false)
        expect(
            await fs.pathExists(
                path.join(targetDir, 'test/features/password-reset.test.ts'),
            ),
        ).toBe(false)

        // package.json dependencies
        const pkg = await fs.readJson(path.join(targetDir, 'package.json'))
        expect(pkg.dependencies['argon2']).toBeUndefined()
        expect(pkg.dependencies['jose']).toBeUndefined()
        expect(pkg.dependencies['resend']).toBeUndefined()

        // .env
        const env = await fs.readFile(path.join(targetDir, '.env'), 'utf-8')
        expect(env).not.toContain('JWT_SECRET')
        expect(env).not.toContain('RESEND_API_KEY')

        // app.ts
        const appTs = await fs.readFile(
            path.join(targetDir, 'src/app.ts'),
            'utf-8',
        )
        expect(appTs).not.toContain('/api/v1/auth')
        expect(appTs).not.toContain('/api/v1/users')
        expect(appTs).toContain('healthRoutes')
        expect(appTs).toContain('docsRoutes')

        // api.routes.test.ts
        const apiTest = await fs.readFile(
            path.join(targetDir, 'test/api.routes.test.ts'),
            'utf-8',
        )
        expect(apiTest).toContain('/health')
        expect(apiTest).not.toContain('/api/v1/auth')
    })

    it('Scenario 4: Custom Minimal (MongoDB + No Auth + No Docs + No Docker + No Git)', async () => {
        const targetDir = path.join(TEST_DIR, 'minimal-app')
        const config: ProjectConfig = {
            projectName: 'minimal-app',
            targetDir,
            database: 'mongodb',
            auth: false,
            docs: false,
            docker: false,
            packageManager: 'npm',
            git: false,
            install: false,
        }

        await generateProject(config)

        // Excluded features
        expect(await fs.pathExists(path.join(targetDir, 'src/docs'))).toBe(
            false,
        )
        expect(await fs.pathExists(path.join(targetDir, 'Dockerfile'))).toBe(
            false,
        )
        expect(await fs.pathExists(path.join(targetDir, '.dockerignore'))).toBe(
            false,
        )
        expect(await fs.pathExists(path.join(targetDir, 'compose.yaml'))).toBe(
            false,
        )
        expect(await fs.pathExists(path.join(targetDir, '.git'))).toBe(false)
        expect(
            await fs.pathExists(path.join(targetDir, 'src/features/auth')),
        ).toBe(false)
        expect(
            await fs.pathExists(path.join(targetDir, 'src/features/users')),
        ).toBe(false)
        expect(
            await fs.pathExists(
                path.join(targetDir, 'test/docs.routes.test.ts'),
            ),
        ).toBe(false)

        // app.ts
        const appTs = await fs.readFile(
            path.join(targetDir, 'src/app.ts'),
            'utf-8',
        )
        expect(appTs).not.toContain('docsRoutes')
        expect(appTs).not.toContain('authRoutes')

        // package.json scripts
        const pkg = await fs.readJson(path.join(targetDir, 'package.json'))
        expect(pkg.scripts['docker:up']).toBeUndefined()
        expect(
            pkg.dependencies['@scalar/express-api-reference'],
        ).toBeUndefined()
        expect(pkg.dependencies['argon2']).toBeUndefined()
    })

    it('Scenario 5: CI workflow generated for npm, bun, and yarn', async () => {
        const npmDir = path.join(TEST_DIR, 'ci-npm')
        await generateProject({
            projectName: 'ci-npm',
            targetDir: npmDir,
            database: 'postgres',
            auth: true,
            docs: true,
            docker: true,
            packageManager: 'npm',
            git: false,
            install: false,
        })
        const npmCi = await fs.readFile(
            path.join(npmDir, '.github/workflows/test.yml'),
            'utf-8',
        )
        expect(npmCi).toContain('npm install')
        expect(npmCi).toContain('npm test')

        const bunDir = path.join(TEST_DIR, 'ci-bun')
        await generateProject({
            projectName: 'ci-bun',
            targetDir: bunDir,
            database: 'mongodb',
            auth: true,
            docs: true,
            docker: true,
            packageManager: 'bun',
            git: false,
            install: false,
        })
        const bunCi = await fs.readFile(
            path.join(bunDir, '.github/workflows/test.yml'),
            'utf-8',
        )
        expect(bunCi).toContain('oven-sh/setup-bun')
        expect(bunCi).toContain('bun install')
        expect(bunCi).toContain('bun test')
        expect(bunCi).toContain('mongodb:')
    })

    it('Scenario 6: pnpm-workspace.yaml configuration for native argon2', async () => {
        const pnpmDir = path.join(TEST_DIR, 'pnpm-auth')
        await generateProject({
            projectName: 'pnpm-auth',
            targetDir: pnpmDir,
            database: 'postgres',
            auth: true,
            docs: true,
            docker: true,
            packageManager: 'pnpm',
            git: false,
            install: false,
        })
        expect(
            await fs.pathExists(path.join(pnpmDir, 'pnpm-workspace.yaml')),
        ).toBe(true)
        const pnpmWs = await fs.readFile(
            path.join(pnpmDir, 'pnpm-workspace.yaml'),
            'utf-8',
        )
        expect(pnpmWs).toContain('argon2: true')

        const npmDir = path.join(TEST_DIR, 'npm-auth')
        await generateProject({
            projectName: 'npm-auth',
            targetDir: npmDir,
            database: 'postgres',
            auth: true,
            docs: true,
            docker: true,
            packageManager: 'npm',
            git: false,
            install: false,
        })
        expect(
            await fs.pathExists(path.join(npmDir, 'pnpm-workspace.yaml')),
        ).toBe(false)
    })

    it('Scenario 7: Custom PostgreSQL + Auth + No Docs + No Docker', async () => {
        const targetDir = path.join(TEST_DIR, 'pg-nodocs-nodocker')
        await generateProject({
            projectName: 'pg-nodocs-nodocker',
            targetDir,
            database: 'postgres',
            auth: true,
            docs: false,
            docker: false,
            packageManager: 'pnpm',
            git: false,
            install: false,
        })
        expect(await fs.pathExists(path.join(targetDir, 'src/docs'))).toBe(
            false,
        )
        expect(await fs.pathExists(path.join(targetDir, 'Dockerfile'))).toBe(
            false,
        )
        expect(await fs.pathExists(path.join(targetDir, 'compose.yaml'))).toBe(
            false,
        )
        expect(
            await fs.pathExists(path.join(targetDir, 'src/features/auth')),
        ).toBe(true)

        const appTs = await fs.readFile(
            path.join(targetDir, 'src/app.ts'),
            'utf-8',
        )
        expect(appTs).not.toContain('docsRoutes')
        expect(appTs).toContain('authRoutes')
    })
})
