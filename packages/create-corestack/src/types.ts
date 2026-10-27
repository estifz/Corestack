export type DatabaseProvider = 'postgres' | 'mongodb'

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export interface ProjectConfig {
    projectName: string
    targetDir: string
    database: DatabaseProvider
    auth: boolean
    docs: boolean
    docker: boolean
    packageManager: PackageManager
    git: boolean
    install: boolean
}

export interface RawCliFlags {
    database?: string
    auth?: boolean
    docs?: boolean
    docker?: boolean
    packageManager?: string
    git?: boolean
    install?: boolean
    yes?: boolean
}
