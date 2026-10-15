import type { AuthUser, CreateUserRecord, UserRecord } from './auth.types.js'

export interface AuthRepository {
    findUserByEmail(email: string): Promise<UserRecord | null>
    findUserById(id: string): Promise<AuthUser | null>
    createUser(input: CreateUserRecord): Promise<AuthUser>
}
