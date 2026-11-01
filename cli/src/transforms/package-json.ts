import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from '../types.js'
import { DEPENDENCY_MAP } from './dependency-map.js'

export function transformPackageJson(config: ProjectConfig): void {
    const root = config.projectPath
    const pkgPath = path.join(root, 'package.json')

    if (!fs.existsSync(pkgPath)) {
        return
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

    // 1. Set project name
    pkg.name = config.projectName

    // 2. Remove monorepo CLI scripts and multi-db scripts
    delete pkg.scripts['cli:dev']
    delete pkg.scripts['cli:build']
    delete pkg.scripts['docker:db:all']

    // 3. Remove database scripts & deps
    const isPostgres = config.databaseProvider === 'postgres'
    if (!isPostgres) {
        for (const script of DEPENDENCY_MAP.mongodb.scriptsToDelete) {
            delete pkg.scripts[script]
        }
        for (const dep of DEPENDENCY_MAP.postgres.dependencies) {
            delete pkg.dependencies?.[dep]
        }
        for (const devDep of DEPENDENCY_MAP.postgres.devDependencies) {
            delete pkg.devDependencies?.[devDep]
        }
        // If no Prisma, build is simply tsc
        pkg.scripts['build'] = 'tsc'
    } else {
        for (const script of DEPENDENCY_MAP.postgres.scriptsToDelete) {
            delete pkg.scripts[script]
        }
        for (const dep of DEPENDENCY_MAP.mongodb.dependencies) {
            delete pkg.dependencies?.[dep]
        }
    }

    // 4. Remove Auth dependencies
    if (!config.includeAuth) {
        for (const dep of DEPENDENCY_MAP.auth.dependencies) {
            delete pkg.dependencies?.[dep]
        }
    }

    // 5. Remove Docs dependencies
    if (!config.includeDocs) {
        for (const dep of DEPENDENCY_MAP.docs.dependencies) {
            delete pkg.dependencies?.[dep]
        }
    }

    // 6. Remove Docker scripts
    if (!config.includeDocker) {
        for (const script of DEPENDENCY_MAP.docker.scriptsToDelete) {
            delete pkg.scripts[script]
        }
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n', 'utf-8')

    // 7. Adapt pnpm-workspace.yaml
    const workspaceYamlPath = path.join(root, 'pnpm-workspace.yaml')
    if (fs.existsSync(workspaceYamlPath)) {
        let builds: Record<string, boolean> = {
            esbuild: true,
        }
        if (isPostgres) {
            builds['@prisma/engines'] = true
            builds['prisma'] = true
        }
        if (config.includeAuth) {
            builds['argon2'] = true
        }

        let yaml = 'allowBuilds:\n'
        for (const [name, val] of Object.entries(builds)) {
            yaml += `    '${name}': ${val}\n`
        }
        fs.writeFileSync(workspaceYamlPath, yaml, 'utf-8')
    }
}
