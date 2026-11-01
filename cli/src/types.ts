export type DatabaseProvider = 'postgres' | 'mongodb'

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export type SetupMode = 'recommended' | 'customize'

export interface ProjectConfig {
    projectName: string
    projectPath: string
    databaseProvider: DatabaseProvider
    includeAuth: boolean
    includeDocs: boolean
    includeDocker: boolean
    packageManager: PackageManager
    dbPort?: number
}

export interface CliFlags {
    recommended?: boolean
    database?: DatabaseProvider
    auth?: boolean
    docs?: boolean
    docker?: boolean
}
