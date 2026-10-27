import path from 'node:path'
import fs from 'fs-extra'
import type { DatabaseProvider, PackageManager } from '../types.js'

export async function transformCI(
    targetDir: string,
    options: {
        database: DatabaseProvider
        packageManager: PackageManager
        docker: boolean
    },
): Promise<void> {
    const { database, packageManager, docker } = options
    const ciPath = path.join(targetDir, '.github/workflows/test.yml')

    if (!(await fs.pathExists(ciPath))) {
        return
    }

    let serviceSection = ''
    let testEnv = ''

    if (database === 'postgres') {
        serviceSection = `        services:
            postgres:
                image: postgres:16-alpine
                env:
                    POSTGRES_USER: test
                    POSTGRES_PASSWORD: test
                    POSTGRES_DB: corestack_test
                ports:
                    - 5432:5432
                options: >-
                    --health-cmd pg_isready
                    --health-interval 10s
                    --health-timeout 5s
                    --health-retries 5`

        testEnv = `              env:
                  TEST_DATABASE_URL: postgresql://test:test@localhost:5432/corestack_test
                  DATABASE_URL: postgresql://test:test@localhost:5432/corestack_test`
    } else {
        serviceSection = `        services:
            mongodb:
                image: mongo:7.0
                ports:
                    - 27017:27017
                options: >-
                    --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
                    --health-interval 10s
                    --health-timeout 5s
                    --health-retries 5`

        testEnv = `              env:
                  MONGODB_URI: mongodb://localhost:27017/corestack_test`
    }

    let pmSetup = ''
    let installCmd = ''
    let testCmd = ''

    switch (packageManager) {
        case 'pnpm':
            pmSetup = `            - name: Setup pnpm
              uses: pnpm/action-setup@v4
              with:
                  version: 11

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: 24
                  cache: 'pnpm'`
            installCmd = 'pnpm install'
            testCmd = 'pnpm test'
            break
        case 'bun':
            pmSetup = `            - name: Setup Bun
              uses: oven-sh/setup-bun@v2
              with:
                  bun-version: latest`
            installCmd = 'bun install'
            testCmd = 'bun test'
            break
        case 'yarn':
            pmSetup = `            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: 24
                  cache: 'yarn'`
            installCmd = 'yarn install'
            testCmd = 'yarn test'
            break
        case 'npm':
        default:
            pmSetup = `            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: 24
                  cache: 'npm'`
            installCmd = 'npm install'
            testCmd = 'npm test'
            break
    }

    let dockerStep = ''
    if (docker) {
        dockerStep = `
            - name: Set up Docker Buildx
              uses: docker/setup-buildx-action@v3

            - name: Verify Docker Production Build
              uses: docker/build-push-action@v6
              with:
                  context: .
                  load: true
                  tags: corestack:ci
                  cache-from: type=gha
                  cache-to: type=gha,mode=max`
    }

    const workflowContent = `name: Tests & Build

on:
    push:
        branches: [main]
    pull_request:
        branches: [main]

jobs:
    test:
        name: Run Tests & Verification
        runs-on: ubuntu-latest

${serviceSection}

        steps:
            - name: Checkout Code
              uses: actions/checkout@v4

${pmSetup}

            - name: Install Dependencies
              run: ${installCmd}

            - name: Run Test Suite
${testEnv}
              run: ${testCmd}
${dockerStep}
`

    await fs.writeFile(ciPath, workflowContent, 'utf-8')
}
