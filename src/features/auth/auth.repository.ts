import type { AuthUser, CreateUserRecord, UserRecord } from './auth.types.js'

export interface AuthRepository {
    findUserByEmail(email: string): Promise<UserRecord | null>
    createUser(input: CreateUserRecord): Promise<AuthUser>
}
