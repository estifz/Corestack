import path from 'node:path'
import fs from 'fs-extra'

export async function transformDocs(
    targetDir: string,
    docs: boolean,
): Promise<void> {
    if (docs) {
        return
    }

    // Docs is FALSE: remove src/docs
    await fs.remove(path.join(targetDir, 'src/docs'))
}
