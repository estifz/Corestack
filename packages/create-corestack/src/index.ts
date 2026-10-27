import * as p from '@clack/prompts'
import pc from 'picocolors'
import { parseCliArgs } from './cli.js'
import { generateProject } from './generator/index.js'
import { runPrompts } from './prompts.js'
import { printBanner, printSuccess } from './utils/banner.js'

async function main(): Promise<void> {
    try {
        const { projectName, flags } = parseCliArgs(process.argv)

        printBanner()

        p.intro(pc.bgCyan(pc.black(' create-corestack ')))

        const config = await runPrompts(projectName, flags)

        await generateProject(config)

        p.outro(pc.green('Your CoreStack application is ready!'))

        printSuccess(config)
    } catch (error) {
        p.cancel(
            pc.red(
                `Error: ${error instanceof Error ? error.message : String(error)}`,
            ),
        )
        process.exit(1)
    }
}

main()
