import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from '../types.js'
import { getRunCommand } from '../utils/pm.js'

export function transformCi(config: ProjectConfig): void {
    const root = config.projectPath
    const isPostgres = config.databaseProvider === 'postgres'
    const pm = config.packageManager
    const workflowsDir = path.join(root, '.github', 'workflows')

    if (!fs.existsSync(workflowsDir)) {
        fs.mkdirSync(workflowsDir, { recursive: true })
    }

    const steps: string[] = []

    // 1. Checkout repository code
    steps.push(
        `            - name: Checkout Code\n              uses: actions/checkout@v4`,
    )

    // 2. Setup runtime & package manager
    if (pm === 'pnpm') {
        steps.push(
            `            - name: Setup pnpm\n              uses: pnpm/action-setup@v4\n              with:\n                  version: 10`,
        )
        steps.push(
            `            - name: Setup Node.js\n              uses: actions/setup-node@v4\n              with:\n                  node-version: 24\n                  cache: 'pnpm'`,
        )
    } else if (pm === 'bun') {
        steps.push(
            `            - name: Setup Bun\n              uses: oven-sh/setup-bun@v2`,
        )
    } else {
        steps.push(
            `            - name: Setup Node.js\n              uses: actions/setup-node@v4\n              with:\n                  node-version: 24\n                  cache: '${pm}'`,
        )
    }

    // 3. Install dependencies
    const installCmd = pm === 'yarn' ? 'yarn install' : `${pm} install`
    steps.push(
        `            - name: Install Dependencies\n              run: ${installCmd}`,
    )

    // 4. Generate Database Client (Prisma / PostgreSQL only)
    if (isPostgres) {
        const generateCmd = getRunCommand(pm, 'db:generate')
        steps.push(
            `            - name: Generate Database Client\n              run: ${generateCmd}`,
        )
    }

    // 5. Run Vitest Suite
    const testCmd = getRunCommand(pm, 'test')
    steps.push(
        `            - name: Run Vitest Suite\n              run: ${testCmd}`,
    )

    const content = `name: Tests

on:
    push:
        branches: [main, master]
    pull_request:
        branches: [main, master]

jobs:
    test:
        name: Run Tests
        runs-on: ubuntu-latest
        steps:
${steps.join('\n\n')}
`

    fs.writeFileSync(path.join(workflowsDir, 'test.yml'), content, 'utf-8')
}
