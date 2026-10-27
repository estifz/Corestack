import type { UserRole } from '../../utils/jwt.js'

export interface UserProfile {
    id: string
    email: string
    role: UserRole
    isActive: boolean
    emailVerifiedAt?: unknown
    createdAt?: unknown
}

export interface ListUsersQueryInput {
    limit: number
    offset: number
}

export interface ListUsersResult {
    users: UserProfile[]
    total: number
}
