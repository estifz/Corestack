import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyTransforms } from './transforms/index.js'
import type { ProjectConfig } from './types.js'
import { findAvailablePort } from './utils/ports.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function getTemplateDir(): string {
    const distPath = path.resolve(__dirname, '../template')
    if (fs.existsSync(distPath)) {
        return distPath
    }

    const srcPath = path.resolve(__dirname, '../../template')
    if (fs.existsSync(srcPath)) {
        return srcPath
    }

    throw new Error(
        `Template directory not found. Looked in ${distPath} and ${srcPath}`,
    )
}

function copyDirectory(src: string, dest: string): void {
    const stat = fs.statSync(src)

    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true })
        for (const entry of fs.readdirSync(src)) {
            copyDirectory(path.join(src, entry), path.join(dest, entry))
        }
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(src, dest)
        if ((stat.mode & 0o111) !== 0) {
            fs.chmodSync(dest, stat.mode)
        }
    }
}

export function prepareTargetDirectory(targetPath: string): void {
    if (fs.existsSync(targetPath)) {
        const files = fs.readdirSync(targetPath)
        if (files.length > 0) {
            throw new Error(
                `Destination directory "${targetPath}" is not empty. Please specify an empty directory or a new folder.`,
            )
        }
    } else {
        fs.mkdirSync(targetPath, { recursive: true })
    }
}

export async function scaffoldProject(config: ProjectConfig): Promise<void> {
    const templateDir = getTemplateDir()

    // 1. Ensure target directory is clean and ready
    prepareTargetDirectory(config.projectPath)

    // 2. Copy base template files
    copyDirectory(templateDir, config.projectPath)

    // 3. Rename _gitignore to .gitignore
    const gitignoreSource = path.join(config.projectPath, '_gitignore')
    const gitignoreDest = path.join(config.projectPath, '.gitignore')
    if (fs.existsSync(gitignoreSource)) {
        fs.renameSync(gitignoreSource, gitignoreDest)
    }

    // 4. Normalize husky pre-commit hook to universal 'npx lint-staged'
    const huskyPreCommit = path.join(config.projectPath, '.husky', 'pre-commit')
    if (fs.existsSync(huskyPreCommit)) {
        fs.writeFileSync(huskyPreCommit, 'npx lint-staged\n', { mode: 0o755 })
    }

    // 5. Automatically resolve available port for the database
    if (config.dbPort === undefined) {
        const preferredPort =
            config.databaseProvider === 'postgres' ? 5432 : 27017
        config.dbPort = await findAvailablePort(preferredPort)
    }

    // 6. Apply modular transformations based on selections
    applyTransforms(config)
}
