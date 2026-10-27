import pc from 'picocolors'
import type { ProjectConfig } from '../types.js'
import { getRunCommand } from './pm.js'

export function printBanner(): void {
    console.log()
    console.log(
        pc.bold(
            pc.cyan(`
   ██████╗ ██████╗ ██████╗ ███████╗███████╗████████╗ █████╗  ██████╗██╗  ██╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
  ██║     ██║   ██║██████╔╝█████╗  ███████╗   ██║   ███████║██║     █████╔╝ 
  ██║     ██║   ██║██╔══██╗██╔══╝  ╚════██║   ██║   ██╔══██║██║     ██╔═██╗ 
  ╚██████╗╚██████╔╝██║  ██║███████╗███████║   ██║   ██║  ██║╚██████╗██║  ██╗
   ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
`),
        ),
    )
    console.log(
        pc.gray(
            '  Production-oriented TypeScript backend foundation — https://corestack.dev',
        ),
    )
    console.log()
}

export function printSuccess(config: ProjectConfig): void {
    const { projectName, database, packageManager, docs, docker } = config
    const runDev = getRunCommand(packageManager, 'dev')
    const runMigration =
        packageManager === 'pnpm' || packageManager === 'bun'
            ? `${packageManager} migration:apply`
            : `${packageManager} run migration:apply`

    const displayPath =
        projectName.startsWith('/') || projectName.startsWith('.')
            ? projectName
            : `./${projectName}`

    console.log()
    console.log(
        pc.green(pc.bold(`✔ Project created successfully in ${displayPath}!`)),
    )
    console.log()
    console.log(pc.bold('Next steps:'))
    console.log(`  ${pc.cyan(`cd ${projectName}`)}`)

    if (docker) {
        if (database === 'postgres') {
            console.log(
                `  ${pc.cyan('docker compose up -d postgres')}          ${pc.gray('# Start PostgreSQL')}`,
            )
            console.log(
                `  ${pc.cyan(runMigration)}                     ${pc.gray('# Apply initial database migration')}`,
            )
        } else {
            console.log(
                `  ${pc.cyan('docker compose up -d mongodb mongo-express')} ${pc.gray('# Start MongoDB & Web GUI')}`,
            )
        }
    } else if (database === 'postgres') {
        console.log(
            `  ${pc.cyan(runMigration)}                     ${pc.gray('# Apply database migration (ensure DATABASE_URL in .env)')}`,
        )
    }

    console.log(
        `  ${pc.cyan(runDev)}                             ${pc.gray('# Start development server')}`,
    )

    console.log()
    if (docs) {
        console.log(
            pc.dim(
                `Interactive API Documentation will be available at ${pc.underline('http://localhost:3000/docs')}`,
            ),
        )
    }
    if (database === 'mongodb' && docker) {
        console.log(
            pc.dim(
                `Mongo Express administration UI will be available at ${pc.underline('http://localhost:8081')}`,
            ),
        )
    }
    console.log()
}
