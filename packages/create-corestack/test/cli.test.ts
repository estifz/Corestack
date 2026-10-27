import { describe, expect, it } from 'vitest'
import { parseCliArgs } from '../src/cli.js'
import { runPrompts } from '../src/prompts.js'

describe('create-corestack CLI Flag Parsing & Validation', () => {
    it('parses short and long flags correctly', () => {
        const { projectName, flags } = parseCliArgs([
            'node',
            'create-corestack',
            'test-app',
            '--database',
            'mongodb',
            '--no-auth',
            '--docs',
            '--no-docker',
            '--pm',
            'bun',
            '--no-git',
            '--no-install',
        ])

        expect(projectName).toBe('test-app')
        expect(flags.database).toBe('mongodb')
        expect(flags.auth).toBe(false)
        expect(flags.docs).toBe(true)
        expect(flags.docker).toBe(false)
        expect(flags.packageManager).toBe('bun')
        expect(flags.git).toBe(false)
        expect(flags.install).toBe(false)
    })

    it('parses alias flags (--db and -d)', () => {
        const result = parseCliArgs([
            'node',
            'create-corestack',
            'test-alias',
            '-d',
            'postgres',
        ])
        expect(result.flags.database).toBe('postgres')
    })

    it('validates database provider', async () => {
        await expect(
            runPrompts('invalid-db-app', {
                database: 'redis',
            }),
        ).rejects.toThrow('Invalid database provider "redis"')
    })

    it('validates package manager', async () => {
        await expect(
            runPrompts('invalid-pm-app', {
                packageManager: 'deno',
            }),
        ).rejects.toThrow('Invalid package manager "deno"')
    })

    it('directly resolves config without interactive prompts when flags are passed', async () => {
        const config = await runPrompts('flags-app', {
            database: 'mongodb',
            auth: false,
            docs: true,
            docker: true,
            packageManager: 'pnpm',
            git: true,
            install: false,
        })

        expect(config.projectName).toBe('flags-app')
        expect(config.database).toBe('mongodb')
        expect(config.auth).toBe(false)
        expect(config.docs).toBe(true)
        expect(config.docker).toBe(true)
        expect(config.packageManager).toBe('pnpm')
        expect(config.git).toBe(true)
        expect(config.install).toBe(false)
    })
})
