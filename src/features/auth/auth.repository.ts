import type { AuthUser, CreateUserRecord } from './auth.types.js'

export interface AuthRepository {
    findUserByEmail(email: string): Promise<AuthUser | null>
    createUser(input: CreateUserRecord): Promise<AuthUser>
}
