import { execa } from 'execa'

export async function initGit(targetDir: string): Promise<boolean> {
    try {
        await execa('git', ['--version'])
        await execa('git', ['init', '-b', 'main'], { cwd: targetDir })
        return true
    } catch {
        return false
    }
}
