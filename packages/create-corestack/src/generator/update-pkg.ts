import path from 'node:path'
import fs from 'fs-extra'
import type { DatabaseProvider, PackageManager } from '../types.js'

export async function updatePackageJson(
    targetDir: string,
    options: {
        projectName: string
        database: DatabaseProvider
        auth: boolean
        docs: boolean
        docker: boolean
        packageManager: PackageManager
    },
): Promise<void> {
    const { projectName, database, auth, docs, docker, packageManager } =
        options
    const pkgPath = path.join(targetDir, 'package.json')

    const pkg = await fs.readJson(pkgPath)

    pkg.name = projectName
    pkg.version = '0.1.0'

    // 1. Tailor dependencies
    const depsToRemove: string[] = []
    const devDepsToRemove: string[] = []

    if (database === 'postgres') {
        depsToRemove.push('mongoose')
    } else {
        depsToRemove.push('@prisma/orm-postgres')
        devDepsToRemove.push('prisma', '@prisma/cli-engine')
    }

    if (!auth) {
        depsToRemove.push('argon2', 'jose', 'resend')
    }

    if (!docs) {
        depsToRemove.push('@scalar/express-api-reference')
    }

    for (const dep of depsToRemove) {
        if (pkg.dependencies && pkg.dependencies[dep]) {
            delete pkg.dependencies[dep]
        }
    }

    for (const devDep of devDepsToRemove) {
        if (pkg.devDependencies && pkg.devDependencies[devDep]) {
            delete pkg.devDependencies[devDep]
        }
    }

    // 2. Tailor scripts
    if (database === 'mongodb') {
        delete pkg.scripts['migration:show']
        delete pkg.scripts['migration:plan']
        delete pkg.scripts['migration:apply']
        delete pkg.scripts['migration:status']
        delete pkg.scripts['contract:emit']
    }

    if (!docker) {
        delete pkg.scripts['docker:db:postgres']
        delete pkg.scripts['docker:db:mongo']
        delete pkg.scripts['docker:db:all']
        delete pkg.scripts['docker:up']
        delete pkg.scripts['docker:down']
    } else {
        if (database === 'postgres') {
            delete pkg.scripts['docker:db:mongo']
            delete pkg.scripts['docker:db:all']
        } else {
            delete pkg.scripts['docker:db:postgres']
            delete pkg.scripts['docker:db:all']
        }
    }

    await fs.writeJson(pkgPath, pkg, { spaces: 4 })

    // Configure pnpm allowBuilds for native argon2 if pnpm + auth
    const workspaceYamlPath = path.join(targetDir, 'pnpm-workspace.yaml')
    if (packageManager === 'pnpm' && auth) {
        await fs.writeFile(
            workspaceYamlPath,
            'allowBuilds:\n    argon2: true\n',
            'utf-8',
        )
    } else {
        await fs.remove(workspaceYamlPath)
    }
}
