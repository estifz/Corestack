import type { PackageManager } from '../types.js'

export function detectPackageManager(): PackageManager {
    const userAgent = process.env.npm_config_user_agent

    if (!userAgent) {
        return 'npm'
    }

    if (userAgent.startsWith('pnpm')) {
        return 'pnpm'
    }
    if (userAgent.startsWith('yarn')) {
        return 'yarn'
    }
    if (userAgent.startsWith('bun')) {
        return 'bun'
    }

    return 'npm'
}

export function getInstallArgs(pm: PackageManager): string[] {
    switch (pm) {
        case 'yarn':
            return []
        default:
            return ['install']
    }
}

export function getRunCommand(pm: PackageManager, script: string): string {
    switch (pm) {
        case 'npm':
            return `npm run ${script}`
        default:
            return `${pm} ${script}`
    }
}

export function getExecCommand(pm: PackageManager, command: string): string {
    switch (pm) {
        case 'pnpm':
            return `pnpm dlx ${command}`
        case 'yarn':
            return `yarn dlx ${command}`
        case 'bun':
            return `bunx ${command}`
        case 'npm':
        default:
            return `npx ${command}`
    }
}
