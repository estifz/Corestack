export interface RegisterUserInput {
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
