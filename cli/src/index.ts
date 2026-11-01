import path from 'node:path'
import { outro, spinner } from '@clack/prompts'
import { Command } from 'commander'
import pc from 'picocolors'
import { runPrompts } from './prompts.js'
import { scaffoldBaseProject } from './scaffold.js'
import type { CliFlags, ProjectConfig } from './types.js'
import { detectPackageManager } from './utils/pm.js'

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
    .action(async (targetDir?: string, flags?: CliFlags) => {
        try {
            let config: ProjectConfig

            if (flags?.recommended) {
                const rawDir = targetDir?.trim() || 'my-app'
                const projectPath = path.resolve(process.cwd(), rawDir)
                const projectName = path.basename(projectPath)
                config = {
                    projectName,
                    projectPath,
                    databaseProvider: 'postgres',
                    includeAuth: true,
                    includeDocs: true,
                    includeDocker: true,
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
            s.start('Scaffolding base project files...')

            await scaffoldBaseProject(config)

            s.stop('Base project files scaffolded successfully.')

            outro(
                pc.green(`Base scaffolding complete in ${config.projectPath}`),
            )
        } catch (error) {
            console.error(
                pc.red('Error:'),
                error instanceof Error ? error.message : error,
            )
            process.exit(1)
        }
    })

program.parse(process.argv)
