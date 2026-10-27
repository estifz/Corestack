import { execa } from 'execa'
import type { PackageManager } from '../types.js'

export function detectPackageManager(): PackageManager {
    const userAgent = process.env.npm_config_user_agent

    if (userAgent) {
        if (userAgent.startsWith('pnpm/')) return 'pnpm'
        if (userAgent.startsWith('bun/')) return 'bun'
        if (userAgent.startsWith('yarn/')) return 'yarn'
        if (userAgent.startsWith('npm/')) return 'npm'
    }

    return 'npm'
}

export function getRunCommand(pm: PackageManager, script: string): string {
    switch (pm) {
        case 'pnpm':
        case 'bun':
            return `${pm} ${script}`
        case 'yarn':
            return `yarn ${script}`
        case 'npm':
        default:
            return `npm run ${script}`
    }
}

export async function installDependencies(
    pm: PackageManager,
    targetDir: string,
): Promise<void> {
    const args = ['install']
    await execa(pm, args, {
        cwd: targetDir,
        env: {
            ...process.env,
            NODE_ENV: undefined,
        },
    })
}
