import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from '../types.js'
import { DEPENDENCY_MAP } from './dependency-map.js'

export function transformDocs(config: ProjectConfig): void {
    if (config.includeDocs) {
        return
    }

    const root = config.projectPath

    // 1. Delete docs files and tests
    for (const relPath of DEPENDENCY_MAP.docs.filesToDelete) {
        const fullPath = path.join(root, relPath)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true })
        }
    }

    // 2. Remove docs route mounting from src/app.ts
    const appFile = path.join(root, 'src', 'app.ts')
    if (fs.existsSync(appFile)) {
        let appCode = fs.readFileSync(appFile, 'utf-8')
        appCode = appCode
            .replace("import docsRoutes from './docs/docs.route.js'\n", '')
            .replace('app.use(docsRoutes)\n', '')
        fs.writeFileSync(appFile, appCode, 'utf-8')
    }
}
