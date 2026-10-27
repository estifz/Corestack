import * as p from '@clack/prompts'
import { execa } from 'execa'
import pc from 'picocolors'
import type { ProjectConfig } from '../types.js'
import { initGit } from '../utils/git.js'
import { installDependencies } from '../utils/pm.js'
import { copyTemplate } from './copy-template.js'
import { transformApp } from './transform-app.js'
import { transformAuth } from './transform-auth.js'
import { transformCI } from './transform-ci.js'
import { transformDatabase } from './transform-db.js'
import { transformDocker } from './transform-docker.js'
import { transformDocs } from './transform-docs.js'
import { transformEnv } from './transform-env.js'
import { transformTests } from './transform-tests.js'
import { updatePackageJson } from './update-pkg.js'

export async function generateProject(config: ProjectConfig): Promise<void> {
    const {
        projectName,
        targetDir,
        database,
        auth,
        docs,
        docker,
        packageManager,
        git,
        install,
    } = config

    const s = p.spinner()

    // 1. Scaffolding files
    s.start(`Scaffolding project in ${pc.cyan(projectName)}...`)

    await copyTemplate(targetDir)
    await transformDatabase(targetDir, database)
    await transformAuth(targetDir, auth)
    await transformDocs(targetDir, docs)
    await transformApp(targetDir, { auth, docs })
    await transformEnv(targetDir, { database, auth })
    await transformDocker(targetDir, { docker, database, auth })
    await transformTests(targetDir, { database, auth, docs })
    await transformCI(targetDir, { database, packageManager, docker })
    await updatePackageJson(targetDir, {
        projectName,
        database,
        auth,
        docs,
        docker,
        packageManager,
    })

    s.stop(`Scaffolded project structure`)

    // 2. Git Initialization
    if (git) {
        s.start('Initializing Git repository...')
        const gitSuccess = await initGit(targetDir)
        if (gitSuccess) {
            s.stop('Initialized Git repository')
        } else {
            s.stop(
                pc.yellow(
                    'Skipped Git initialization (git executable not found or error)',
                ),
            )
        }
    }

    // 3. Package installation
    if (install) {
        s.start(`Installing dependencies with ${pc.cyan(packageManager)}...`)
        try {
            await installDependencies(packageManager, targetDir)
            s.stop(`Installed dependencies with ${pc.cyan(packageManager)}`)

            if (database === 'postgres') {
                s.start('Generating Prisma Client...')
                try {
                    await execa(
                        packageManager,
                        packageManager === 'npm'
                            ? ['run', 'db:generate']
                            : ['db:generate'],
                        { cwd: targetDir },
                    )
                    s.stop('Generated Prisma Client')
                } catch {
                    s.stop(
                        pc.yellow(
                            `Failed to generate Prisma Client. Run \`${packageManager} run db:generate\` manually.`,
                        ),
                    )
                }
            }
        } catch {
            s.stop(
                pc.yellow(
                    `Failed to install dependencies automatically. Run \`${packageManager} install\` manually.`,
                ),
            )
        }
    }
}
