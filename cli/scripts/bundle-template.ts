import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '../../')
const TEMPLATE_DIR = path.resolve(__dirname, '../template')

// Exact root files and directories to copy into the template bundle
const INCLUDED_ENTRIES = [
    'src',
    'prisma',
    'test',
    'docs',
    '.husky',
    'compose.yaml',
    'Dockerfile',
    'docker-entrypoint.sh',
    '.dockerignore',
    '.env.example',
    '.gitattributes',
    '.gitignore',
    '.prettierignore',
    '.prettierrc',
    '.tool-versions',
    'package.json',
    'pnpm-workspace.yaml',
    'prisma.config.ts',
    'tsconfig.json',
    'vitest.config.ts',
]

// Strict exclusions even if found inside included directories
const EXCLUDE_PATTERNS = [
    /(^|[/\\])node_modules([/\\]|$)/,
    /(^|[/\\])\.git([/\\]|$)/,
    /(^|[/\\])dist([/\\]|$)/,
    /(^|[/\\])\.env$/,
    /(^|[/\\])\.env\..+$/,
    /(^|[/\\])cli([/\\]|$)/,
    /(^|[/\\])\.husky[/\\]_([/\\]|$)/,
]

function shouldExclude(sourcePath: string): boolean {
    return EXCLUDE_PATTERNS.some((pattern) => pattern.test(sourcePath))
}

function copyRecursive(src: string, dest: string): void {
    if (shouldExclude(src)) {
        return
    }

    const stat = fs.statSync(src)

    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true })
        const entries = fs.readdirSync(src)
        for (const entry of entries) {
            const srcEntry = path.join(src, entry)
            const destEntry = path.join(dest, entry)
            copyRecursive(srcEntry, destEntry)
        }
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(src, dest)
        // Preserve executable permission for scripts (e.g. docker-entrypoint.sh, husky hooks)
        if ((stat.mode & 0o111) !== 0) {
            fs.chmodSync(dest, stat.mode)
        }
    }
}

export function bundleTemplate(): void {
    console.log('[bundle-template] Packaging v0.5.0 into cli/template/...')

    if (fs.existsSync(TEMPLATE_DIR)) {
        fs.rmSync(TEMPLATE_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true })

    for (const entry of INCLUDED_ENTRIES) {
        const srcPath = path.join(ROOT_DIR, entry)
        if (!fs.existsSync(srcPath)) {
            console.warn(
                `[bundle-template] Warning: ${entry} not found in root`,
            )
            continue
        }

        // Store .gitignore as _gitignore so npm packaging does not omit it
        const targetEntry = entry === '.gitignore' ? '_gitignore' : entry
        const destPath = path.join(TEMPLATE_DIR, targetEntry)

        copyRecursive(srcPath, destPath)
    }

    console.log('[bundle-template] Successfully bundled template files.')
}

bundleTemplate()
