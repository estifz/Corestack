import { execa } from 'execa'
import type { PackageManager } from '../types.js'
import { getInstallArgs } from './pm.js'

export async function installDependencies(
    projectPath: string,
    pm: PackageManager,
): Promise<void> {
    const args = getInstallArgs(pm)
    await execa(pm, args, {
        cwd: projectPath,
        stdio: 'ignore',
        env: {
            ...process.env,
            HUSKY: '1',
        },
    })
}

export async function runPrismaGenerate(
    projectPath: string,
    pm: PackageManager,
): Promise<void> {
    const args =
        pm === 'npm' || pm === 'bun' ? ['run', 'db:generate'] : ['db:generate']
    await execa(pm, args, {
        cwd: projectPath,
        stdio: 'ignore',
    })
}
