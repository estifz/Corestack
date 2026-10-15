export interface RegisterUserInput {
    email: string
    password: string
}

export interface LoginUserInput {
    email: string
    password: string
}

export interface CreateUserRecord {
    email: string
    passwordHash: string
}

export interface AuthUser {
    id: string
    email: string
    role: 'USER' | 'ADMIN'
    isActive: boolean
}

export interface UserRecord extends AuthUser {
    passwordHash: string
    emailVerifiedAt: unknown | null
}

export interface LoginResult {
    user: AuthUser
    accessToken: string
}
