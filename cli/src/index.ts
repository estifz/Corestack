import path from 'node:path'
import { note, outro, spinner } from '@clack/prompts'
import { Command } from 'commander'
import pc from 'picocolors'
import { runPrompts } from './prompts.js'
import { scaffoldProject } from './scaffold.js'
import type { CliFlags, ProjectConfig } from './types.js'
import { commitInitialFiles, initGit } from './utils/git.js'
import {
    formatProject,
    installDependencies,
    runPrismaGenerate,
} from './utils/installer.js'
import { detectPackageManager, getRunCommand } from './utils/pm.js'

const program = new Command()
    .name('create-corestack')
    .description('Scaffold a modern, production-grade CoreStack backend')
    .argument('[target-dir]', 'Directory where the project will be created')
    .option('-r, --recommended', 'Use recommended preset defaults')
    .option(
        '-d, --database <provider>',
        'Database provider (postgres | mongodb)',
    )
    .option('--no-auth', 'Exclude Authentication & RBAC')
    .option('--no-docs', 'Exclude Interactive API Documentation')
    .option('--no-docker', 'Exclude Docker & Compose configuration')
    .option('--skip-install', 'Skip dependency installation and git init')
    .action(
        async (
            targetDir?: string,
            flags?: CliFlags & { skipInstall?: boolean },
        ) => {
            try {
                let config: ProjectConfig

                const hasExplicitFlags = process.argv
                    .slice(2)
                    .some((arg) => arg.startsWith('-'))

                if (hasExplicitFlags) {
                    const rawDir = targetDir?.trim() || 'my-app'
                    const projectPath = path.resolve(process.cwd(), rawDir)
                    const projectName = path.basename(projectPath)
                    config = {
                        projectName,
                        projectPath,
                        databaseProvider: flags?.database ?? 'postgres',
                        includeAuth: flags?.auth ?? true,
                        includeDocs: flags?.docs ?? true,
                        includeDocker: flags?.docker ?? true,
                        packageManager: detectPackageManager(),
                    }
                } else {
                    config = await runPrompts(targetDir)
                }

                // Summary of captured config
                console.log('\n' + pc.bold(pc.green('Selected Configuration:')))
                console.log(
                    `  ${pc.cyan('Project Name:')}     ${config.projectName}`,
                )
                console.log(
                    `  ${pc.cyan('Target Path:')}      ${config.projectPath}`,
                )
                console.log(
                    `  ${pc.cyan('Database:')}         ${config.databaseProvider}`,
                )
                console.log(
                    `  ${pc.cyan('Auth & RBAC:')}      ${config.includeAuth ? pc.green('Yes') : pc.red('No')}`,
                )
                console.log(
                    `  ${pc.cyan('Documentation:')}    ${config.includeDocs ? pc.green('Yes') : pc.red('No')}`,
                )
                console.log(
                    `  ${pc.cyan('Docker Setup:')}     ${config.includeDocker ? pc.green('Yes') : pc.red('No')}`,
                )
                console.log(
                    `  ${pc.cyan('Package Manager:')}  ${config.packageManager}`,
                )
                console.log('')

                const s = spinner()

                // 1. Scaffold files and apply modular transformations
                s.start('Scaffolding and configuring project files...')
                await scaffoldProject(config)
                s.stop('Project files scaffolded and configured.')

                if (!flags?.skipInstall) {
                    // 2. Git initialization
                    s.start('Initializing git repository...')
                    const gitSuccess = await initGit(config.projectPath)
                    if (gitSuccess) {
                        s.stop('Git repository initialized.')
                    } else {
                        s.stop(
                            pc.yellow(
                                'Git repository initialization skipped (git command unavailable).',
                            ),
                        )
                    }

                    // 3. Dependency installation
                    s.start(
                        `Installing dependencies with ${config.packageManager}...`,
                    )
                    await installDependencies(
                        config.projectPath,
                        config.packageManager,
                    )
                    s.stop('Dependencies installed successfully.')

                    // 4. Prisma client generation (Postgres only)
                    if (config.databaseProvider === 'postgres') {
                        s.start('Generating Prisma client...')
                        await runPrismaGenerate(
                            config.projectPath,
                            config.packageManager,
                        )
                        s.stop('Prisma client generated.')
                    }

                    // 5. Ensure all generated and tailored files conform to Prettier
                    await formatProject(
                        config.projectPath,
                        config.packageManager,
                    )

                    // 6. Create the initial git commit
                    if (gitSuccess) {
                        await commitInitialFiles(config.projectPath)
                    }
                }

                // 6. Build tailored next steps instructions
                const pm = config.packageManager
                const steps: string[] = []

                steps.push(`1. Navigate to your project directory:`)
                steps.push(`   ${pc.cyan(`cd ${config.projectName}`)}`)
                steps.push('')

                let stepNum = 2
                if (config.databaseProvider === 'postgres') {
                    if (config.includeDocker) {
                        steps.push(
                            `${stepNum++}. Start the PostgreSQL container:`,
                        )
                        steps.push(
                            `   ${pc.cyan('docker compose up -d postgres')}`,
                        )
                        steps.push('')
                    }
                    steps.push(`${stepNum++}. Apply database migrations:`)
                    steps.push(
                        `   ${pc.cyan(getRunCommand(pm, 'migration:dev'))}`,
                    )
                    steps.push('')
                } else {
                    if (config.includeDocker) {
                        steps.push(
                            `${stepNum++}. Start MongoDB and Mongo Express UI:`,
                        )
                        steps.push(
                            `   ${pc.cyan('docker compose up -d mongodb mongo-express')}`,
                        )
                        steps.push(
                            `   ${pc.dim('(Mongo Express admin UI at http://localhost:8081)')}`,
                        )
                        steps.push('')
                    }
                }

                steps.push(`${stepNum++}. Start the development server:`)
                steps.push(`   ${pc.cyan(getRunCommand(pm, 'dev'))}`)

                note(
                    steps.join('\n'),
                    'Your CoreStack project is ready! Next steps:',
                )

                outro(pc.bold(pc.green('Happy engineering! 🚀')))
            } catch (error) {
                console.error(
                    pc.red('Error:'),
                    error instanceof Error ? error.message : error,
                )
                process.exit(1)
            }
        },
    )

program.parse(process.argv)
