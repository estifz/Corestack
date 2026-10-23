import type {
    AuthUser,
    CreateSessionInput,
    CreateUserRecord,
    RotateRefreshTokenInput,
    RotateRefreshTokenResult,
    UserRecord,
} from './auth.types.js'

export interface AuthRepository {
    findUserByEmail(email: string): Promise<UserRecord | null>
    findUserById(id: string): Promise<AuthUser | null>
    createUser(input: CreateUserRecord): Promise<AuthUser>
    createEmailVerificationToken(input: {
        userId: string
        tokenHash: string
        expiresAt: Temporal.Instant
        createdAt: Temporal.Instant
    }): Promise<void>
    verifyEmail(tokenHash: string, now: Temporal.Instant): Promise<boolean>
    createPasswordResetToken(input: {
        userId: string
        tokenHash: string
        expiresAt: Temporal.Instant
        createdAt: Temporal.Instant
    }): Promise<void>
    resetPassword(input: {
        tokenHash: string
        newPasswordHash: string
        now: Temporal.Instant
    }): Promise<boolean>
    createSession(input: CreateSessionInput): Promise<void>
    rotateRefreshToken(
        input: RotateRefreshTokenInput,
    ): Promise<RotateRefreshTokenResult>
    revokeSessionByRefreshTokenHash(
        tokenHash: string,
        revokedAt: Temporal.Instant,
    ): Promise<void>
}
