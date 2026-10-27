import { Command } from 'commander'
import type { RawCliFlags } from './types.js'

export interface ParsedCliInput {
    projectName?: string
    flags: RawCliFlags
}

export function parseCliArgs(argv = process.argv): ParsedCliInput {
    const program = new Command()

    program
        .name('create-corestack')
        .description(
            'Scaffold a production-oriented TypeScript backend powered by CoreStack',
        )
        .argument('[project-name]', 'Directory name for the new project')
        .option(
            '-d, --database <provider>',
            'Database provider (postgres, mongodb)',
        )
        .option('--db <provider>', 'Alias for --database')
        .option('--auth', 'Include Authentication & RBAC')
        .option('--no-auth', 'Exclude Authentication & RBAC')
        .option('--docs', 'Include Interactive OpenAPI Scalar documentation')
        .option('--no-docs', 'Exclude Interactive OpenAPI Scalar documentation')
        .option(
            '--docker',
            'Include Dockerfile and Docker Compose orchestration',
        )
        .option(
            '--no-docker',
            'Exclude Dockerfile and Docker Compose orchestration',
        )
        .option(
            '-p, --package-manager <manager>',
            'Package manager to use (pnpm, npm, yarn, bun)',
        )
        .option('--pm <manager>', 'Alias for --package-manager')
        .option('--git', 'Initialize a git repository')
        .option('--no-git', 'Do not initialize a git repository')
        .option('--install', 'Install dependencies automatically')
        .option('--no-install', 'Do not install dependencies automatically')
        .option(
            '-y, --yes',
            'Use recommended defaults without interactive prompts',
        )
        .version('1.0.0', '-v, --version', 'Output current version')

    program.parse(argv)

    const projectName = program.args[0]
    const opts = program.opts<RawCliFlags & { db?: string; pm?: string }>()

    const normalizedFlags: RawCliFlags = {
        ...opts,
        database: opts.database || opts.db,
        packageManager: opts.packageManager || opts.pm,
    }

    return {
        projectName,
        flags: normalizedFlags,
    }
}
