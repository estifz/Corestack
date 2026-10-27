import type { Temporal } from 'temporal-polyfill/full'

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
    refreshToken: string
    refreshTokenMaxAgeMs: number
}

export interface AuthRequestMetadata {
    ipAddress: string | null
    userAgent: string | null
}

export interface CreateSessionInput extends AuthRequestMetadata {
    userId: string
    sessionExpiresAt: Temporal.Instant
    refreshTokenHash: string
    refreshTokenExpiresAt: Temporal.Instant
}

export interface RotateRefreshTokenInput {
    tokenHash: string
    nextTokenHash: string
    now: Temporal.Instant
    refreshTokenTtlSeconds: number
}

export type RotateRefreshTokenResult =
    | {
          kind: 'rotated'
          user: Pick<AuthUser, 'id' | 'role'>
          refreshTokenExpiresAt: Temporal.Instant
      }
    | { kind: 'invalid' | 'reused' }

export interface RefreshResult {
    accessToken: string
    refreshToken: string
    refreshTokenMaxAgeMs: number
}
