import { execa } from 'execa'

export async function initGit(projectPath: string): Promise<boolean> {
    try {
        await execa('git', ['init'], {
            cwd: projectPath,
            stdio: 'ignore',
        })
        return true
    } catch {
        return false
    }
}
