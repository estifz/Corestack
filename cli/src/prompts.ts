import { cancel, confirm, isCancel, select, text } from '@clack/prompts'
import path from 'node:path'
import pc from 'picocolors'
import type { DatabaseProvider, ProjectConfig, SetupMode } from './types.js'
import { detectPackageManager } from './utils/pm.js'

export async function runPrompts(
    initialTargetDir?: string,
): Promise<ProjectConfig> {
    // 1. Target directory
    let targetDir = initialTargetDir

    if (!targetDir) {
        const inputDir = await text({
            message: 'Where should your project be created?',
            placeholder: 'my-app',
            defaultValue: 'my-app',
            validate(value) {
                if (value.trim().length === 0) {
                    return 'Project directory cannot be empty'
                }
                if (!/^[a-zA-Z0-9._-]+$/.test(value.trim())) {
                    return 'Project directory name contains invalid characters'
                }
                return undefined
            },
        })

        if (isCancel(inputDir)) {
            cancel('Operation cancelled.')
            process.exit(0)
        }

        targetDir = inputDir.trim()
    }

    const projectName = path.basename(path.resolve(process.cwd(), targetDir))
    const projectPath = path.resolve(process.cwd(), targetDir)

    // 2. Setup mode: Recommended vs Customize
    const setupMode = (await select({
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
                hint: 'Pick database, toggle auth, docs, docker',
            },
        ],
        initialValue: 'recommended',
    })) as SetupMode

    if (isCancel(setupMode)) {
        cancel('Operation cancelled.')
        process.exit(0)
    }

    let databaseProvider: DatabaseProvider = 'postgres'
    let includeAuth = true
    let includeDocs = true
    let includeDocker = true

    if (setupMode === 'customize') {
        // 3. Database provider
        const dbChoice = await select({
            message: 'Which database provider do you want to use?',
            options: [
                {
                    value: 'postgres',
                    label: 'PostgreSQL (Prisma)',
                },
                {
                    value: 'mongodb',
                    label: 'MongoDB (Mongoose)',
                },
            ],
            initialValue: 'postgres',
        })

        if (isCancel(dbChoice)) {
            cancel('Operation cancelled.')
            process.exit(0)
        }

        databaseProvider = dbChoice as DatabaseProvider

        // 4. Authentication & RBAC
        const authChoice = await confirm({
            message: 'Include Authentication & RBAC?',
            initialValue: true,
        })

        if (isCancel(authChoice)) {
            cancel('Operation cancelled.')
            process.exit(0)
        }

        includeAuth = authChoice

        // 5. Interactive API Documentation
        const docsChoice = await confirm({
            message: 'Include Interactive API Documentation?',
            initialValue: true,
        })

        if (isCancel(docsChoice)) {
            cancel('Operation cancelled.')
            process.exit(0)
        }

        includeDocs = docsChoice

        // 6. Docker & Compose
        const dockerChoice = await confirm({
            message: 'Include Docker & Compose setup?',
            initialValue: true,
        })

        if (isCancel(dockerChoice)) {
            cancel('Operation cancelled.')
            process.exit(0)
        }

        includeDocker = dockerChoice
    }

    const packageManager = detectPackageManager()

    return {
        projectName,
        projectPath,
        databaseProvider,
        includeAuth,
        includeDocs,
        includeDocker,
        packageManager,
    }
}
