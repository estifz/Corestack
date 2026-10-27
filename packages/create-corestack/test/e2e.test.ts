import path from 'node:path'
import { execa } from 'execa'
import fs from 'fs-extra'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateProject } from '../src/generator/index.js'
import type { ProjectConfig } from '../src/types.js'

const E2E_DIR = path.resolve(process.cwd(), '.tmp-e2e-scenarios')

describe(
    'create-corestack E2E Verification (Typecheck & Tests)',
    { timeout: 60000 },
    () => {
        beforeAll(async () => {
            await fs.emptyDir(E2E_DIR)
        })

        afterAll(async () => {
            await fs.remove(E2E_DIR)
        })

        it('E2E: Recommended Setup compiles TypeScript cleanly', async () => {
            const targetDir = path.join(E2E_DIR, 'pg-rec')
            const config: ProjectConfig = {
                projectName: 'pg-rec',
                targetDir,
                database: 'postgres',
                auth: true,
                docs: true,
                docker: true,
                packageManager: 'pnpm',
                git: false,
                install: false,
            }

            await generateProject(config)

            // Run typecheck
            const result = await execa('npx', ['tsc', '--noEmit'], {
                cwd: targetDir,
            })
            expect(result.exitCode).toBe(0)
        })

        it('E2E: Custom MongoDB + Auth compiles TypeScript cleanly', async () => {
            const targetDir = path.join(E2E_DIR, 'mongo-auth')
            const config: ProjectConfig = {
                projectName: 'mongo-auth',
                targetDir,
                database: 'mongodb',
                auth: true,
                docs: true,
                docker: true,
                packageManager: 'pnpm',
                git: false,
                install: false,
            }

            await generateProject(config)

            // Run typecheck
            const result = await execa('npx', ['tsc', '--noEmit'], {
                cwd: targetDir,
            })
            expect(result.exitCode).toBe(0)
        })

        it('E2E: Custom No-Auth compiles TypeScript cleanly', async () => {
            const targetDir = path.join(E2E_DIR, 'no-auth')
            const config: ProjectConfig = {
                projectName: 'no-auth',
                targetDir,
                database: 'postgres',
                auth: false,
                docs: true,
                docker: true,
                packageManager: 'pnpm',
                git: false,
                install: false,
            }

            await generateProject(config)

            // Run typecheck
            const result = await execa('npx', ['tsc', '--noEmit'], {
                cwd: targetDir,
            })
            expect(result.exitCode).toBe(0)
        })

        it('E2E: Custom Minimal (Mongo + No Auth + No Docs) compiles TypeScript cleanly', async () => {
            const targetDir = path.join(E2E_DIR, 'minimal')
            const config: ProjectConfig = {
                projectName: 'minimal',
                targetDir,
                database: 'mongodb',
                auth: false,
                docs: false,
                docker: false,
                packageManager: 'pnpm',
                git: false,
                install: false,
            }

            await generateProject(config)

            // Run typecheck
            const result = await execa('npx', ['tsc', '--noEmit'], {
                cwd: targetDir,
            })
            expect(result.exitCode).toBe(0)
        })

        it('E2E: Tests run cleanly in No-Auth project', async () => {
            const targetDir = path.join(E2E_DIR, 'no-auth-tests')
            const config: ProjectConfig = {
                projectName: 'no-auth-tests',
                targetDir,
                database: 'postgres',
                auth: false,
                docs: true,
                docker: true,
                packageManager: 'pnpm',
                git: false,
                install: false,
            }

            await generateProject(config)

            // Run vitest in the generated project
            const result = await execa('npx', ['vitest', 'run'], {
                cwd: targetDir,
            })
            expect(result.exitCode).toBe(0)
        })
    },
)
