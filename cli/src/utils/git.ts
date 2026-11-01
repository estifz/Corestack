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

export async function commitInitialFiles(
    projectPath: string,
): Promise<boolean> {
    try {
        await execa('git', ['add', '.'], {
            cwd: projectPath,
            stdio: 'ignore',
        })

        try {
            await execa(
                'git',
                [
                    'commit',
                    '-m',
                    'Initial commit from Create Corestack',
                    '--no-verify',
                ],
                {
                    cwd: projectPath,
                    stdio: 'ignore',
                },
            )
        } catch {
            await execa(
                'git',
                [
                    '-c',
                    'user.name=CoreStack',
                    '-c',
                    'user.email=corestack@local',
                    'commit',
                    '-m',
                    'Initial commit from Create Corestack',
                    '--no-verify',
                ],
                {
                    cwd: projectPath,
                    stdio: 'ignore',
                },
            )
        }
        return true
    } catch {
        return false
    }
}
