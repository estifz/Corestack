import path from 'node:path'
import * as p from '@clack/prompts'
import fs from 'fs-extra'
import pc from 'picocolors'
import type {
    DatabaseProvider,
    PackageManager,
    ProjectConfig,
    RawCliFlags,
} from './types.js'
import { detectPackageManager } from './utils/pm.js'

export async function runPrompts(
    projectNameArg?: string,
    flags: RawCliFlags = {},
): Promise<ProjectConfig> {
    const detectedPm = detectPackageManager()

    // 1. Project Name / Destination
    let projectName = projectNameArg || ''
    if (!projectName && !flags.yes) {
        const namePrompt = await p.text({
            message: 'Where should your project be created?',
            placeholder: 'my-app',
            defaultValue: 'my-app',
            validate: (value) => {
                const target = path.resolve(process.cwd(), value || 'my-app')
                if (
                    fs.existsSync(target) &&
                    fs.readdirSync(target).length > 0
                ) {
                    return `Directory "${value}" already exists and is not empty.`
                }
                if (value && !/^([@a-zA-Z0-9-_.~/]+)$/.test(value)) {
                    return 'Invalid directory name. Please use alphanumeric characters, dashes, or underscores.'
                }
            },
        })

        if (p.isCancel(namePrompt)) {
            p.cancel('Operation cancelled.')
            process.exit(0)
        }
        projectName = namePrompt || 'my-app'
    } else if (!projectName) {
        projectName = 'my-app'
    }

    const targetDir = path.resolve(process.cwd(), projectName)

    // Validate flags if provided
    if (flags.database && !['postgres', 'mongodb'].includes(flags.database)) {
        throw new Error(
            `Invalid database provider "${flags.database}". Allowed values: postgres, mongodb`,
        )
    }

    if (
        flags.packageManager &&
        !['pnpm', 'npm', 'yarn', 'bun'].includes(flags.packageManager)
    ) {
        throw new Error(
            `Invalid package manager "${flags.packageManager}". Allowed values: pnpm, npm, yarn, bun`,
        )
    }

    const hasExplicitFlags =
        flags.yes ||
        flags.database !== undefined ||
        flags.auth !== undefined ||
        flags.docs !== undefined ||
        flags.docker !== undefined ||
        flags.packageManager !== undefined

    // Non-interactive mode when flags are provided
    if (hasExplicitFlags) {
        return {
            projectName,
            targetDir,
            database: (flags.database as DatabaseProvider) || 'postgres',
            auth: flags.auth ?? true,
            docs: flags.docs ?? true,
            docker: flags.docker ?? true,
            packageManager:
                (flags.packageManager as PackageManager) || detectedPm,
            git: flags.git ?? true,
            install: flags.install ?? true,
        }
    }

    // 2. Setup Mode (Recommended vs Customize)
    const setupMode = await p.select({
        message: 'How would you like to set up your project?',
        options: [
            {
                value: 'recommended',
                label: 'Recommended',
                hint: 'PostgreSQL + Prisma, Complete Auth, Scalar Docs, Docker',
            },
            {
                value: 'customize',
                label: 'Customize',
                hint: 'Pick database, toggle auth, docs, docker, package manager',
            },
        ],
        initialValue: 'recommended',
    })

    if (p.isCancel(setupMode)) {
        p.cancel('Operation cancelled.')
        process.exit(0)
    }

    // Recommended setup
    if (setupMode === 'recommended') {
        return {
            projectName,
            targetDir,
            database: 'postgres',
            auth: true,
            docs: true,
            docker: true,
            packageManager: detectedPm,
            git: flags.git ?? true,
            install: flags.install ?? true,
        }
    }

    // Customize questionnaire
    // 3. Database Provider
    const database = (await p.select({
        message: 'Which database provider do you want to use?',
        options: [
            { value: 'postgres', label: 'PostgreSQL (Prisma)' },
            { value: 'mongodb', label: 'MongoDB (Mongoose)' },
        ],
        initialValue: 'postgres',
    })) as DatabaseProvider

    if (p.isCancel(database)) {
        p.cancel('Operation cancelled.')
        process.exit(0)
    }

    // 4. Authentication & RBAC
    const auth = await p.select({
        message: 'Include Authentication & RBAC?',
        options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
        ],
        initialValue: true,
    })

    if (p.isCancel(auth)) {
        p.cancel('Operation cancelled.')
        process.exit(0)
    }

    // 5. Interactive API Documentation
    const docs = await p.select({
        message: 'Include Interactive API Documentation?',
        options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
        ],
        initialValue: true,
    })

    if (p.isCancel(docs)) {
        p.cancel('Operation cancelled.')
        process.exit(0)
    }

    // 6. Docker & Compose
    const docker = await p.select({
        message: 'Include Docker & Compose setup?',
        options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
        ],
        initialValue: true,
    })

    if (p.isCancel(docker)) {
        p.cancel('Operation cancelled.')
        process.exit(0)
    }

    // 7. Package Manager
    const packageManager = (await p.select({
        message: 'Which package manager do you want to use?',
        options: [
            { value: 'pnpm', label: 'pnpm' },
            { value: 'npm', label: 'npm' },
            { value: 'yarn', label: 'yarn' },
            { value: 'bun', label: 'bun' },
        ],
        initialValue: detectedPm,
    })) as PackageManager

    if (p.isCancel(packageManager)) {
        p.cancel('Operation cancelled.')
        process.exit(0)
    }

    return {
        projectName,
        targetDir,
        database,
        auth: auth as boolean,
        docs: docs as boolean,
        docker: docker as boolean,
        packageManager,
        git: flags.git ?? true,
        install: flags.install ?? true,
    }
}
