import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from '../types.js'

export function transformVscode(config: ProjectConfig): void {
    const root = config.projectPath
    const isPostgres = config.databaseProvider === 'postgres'
    const vscodeDir = path.join(root, '.vscode')

    if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true })
    }

    // 1. .vscode/settings.json
    const settings: Record<string, unknown> = {
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
        'editor.formatOnSave': true,
        '[typescript]': {
            'editor.defaultFormatter': 'esbenp.prettier-vscode',
        },
        '[javascript]': {
            'editor.defaultFormatter': 'esbenp.prettier-vscode',
        },
        '[json]': {
            'editor.defaultFormatter': 'esbenp.prettier-vscode',
        },
    }

    if (isPostgres) {
        settings['[prisma]'] = {
            'editor.defaultFormatter': 'Prisma.prisma',
        }
    }

    fs.writeFileSync(
        path.join(vscodeDir, 'settings.json'),
        JSON.stringify(settings, null, 4) + '\n',
        'utf-8',
    )

    // 2. .vscode/extensions.json
    const recommendations = ['esbenp.prettier-vscode', 'humao.rest-client']
    if (isPostgres) {
        recommendations.push('Prisma.prisma')
    }

    const extensions = {
        recommendations,
    }

    fs.writeFileSync(
        path.join(vscodeDir, 'extensions.json'),
        JSON.stringify(extensions, null, 4) + '\n',
        'utf-8',
    )
}
