import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function getTemplateDir(): string {
    const candidates = [
        path.resolve(__dirname, '../template'),
        path.resolve(__dirname, '../../template'),
        path.resolve(__dirname, '../../../template'),
    ]

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate
        }
    }

    throw new Error('CoreStack template directory not found.')
}

export async function copyTemplate(targetDir: string): Promise<void> {
    const templateDir = getTemplateDir()

    await fs.ensureDir(targetDir)
    await fs.copy(templateDir, targetDir, {
        overwrite: true,
        errorOnExist: false,
    })

    // Rename _gitignore to .gitignore
    const gitignorePath = path.join(targetDir, '_gitignore')
    const finalGitignorePath = path.join(targetDir, '.gitignore')
    if (await fs.pathExists(gitignorePath)) {
        await fs.move(gitignorePath, finalGitignorePath, { overwrite: true })
    }
}
