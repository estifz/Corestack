import argon2 from 'argon2'
import { Temporal } from 'temporal-polyfill/full'
import { ENV } from '../../config/env.js'
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from '../../utils/errors/appError.js'
import { signAccessToken } from '../../utils/jwt.js'
import { createRefreshToken, hashRefreshToken } from './refresh-token.js'
import type { AuthRepository } from './auth.repository.js'
import type {
    AuthUser,
    AuthRequestMetadata,
    LoginResult,
    LoginUserInput,
    RefreshResult,
    RegisterUserInput,
} from './auth.types.js'

export class AuthService {
    constructor(private readonly repository: AuthRepository) {}

    async register(input: RegisterUserInput): Promise<AuthUser> {
        const normalizedEmail = input.email.trim().toLowerCase()
        const existingUser =
            await this.repository.findUserByEmail(normalizedEmail)
        if (existingUser) {
            throw new ConflictError('A user with this email already exists')
        }

        const passwordHash = await argon2.hash(input.password)
        return this.repository.createUser({
            email: normalizedEmail,
            passwordHash,
        })
    }

    async login(
        input: LoginUserInput,
        metadata: AuthRequestMetadata,
    ): Promise<LoginResult> {
        const normalizedEmail = input.email.trim().toLowerCase()
        const user = await this.repository.findUserByEmail(normalizedEmail)

        if (!user) {
            throw new UnauthorizedError('Invalid credentials')
        }

        const isPasswordValid = await argon2.verify(
            user.passwordHash,
            input.password,
        )
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials')
        }

        if (!user.isActive) {
            throw new ForbiddenError('Account is inactive')
        }

        if (!user.emailVerifiedAt) {
            throw new ForbiddenError('Account is not verified')
        }

        const now = Temporal.Now.instant()
        const sessionExpiresAt = now.add({ seconds: ENV.SESSION_TTL_SECONDS })
        const refreshTokenExpiresAt = minInstant(
            now.add({ seconds: ENV.REFRESH_TOKEN_TTL_SECONDS }),
            sessionExpiresAt,
        )
        const refreshToken = createRefreshToken()

        await this.repository.createSession({
            userId: user.id,
            ...metadata,
            sessionExpiresAt,
            refreshTokenHash: hashRefreshToken(refreshToken),
            refreshTokenExpiresAt,
        })

        const accessToken = await signAccessToken({
            userId: user.id,
            role: user.role,
        })

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            },
            accessToken,
            refreshToken,
            refreshTokenMaxAgeMs: instantDifferenceMs(
                refreshTokenExpiresAt,
                now,
            ),
        }
    }

    async refresh(token: string): Promise<RefreshResult> {
        const now = Temporal.Now.instant()
        const nextRefreshToken = createRefreshToken()
        const rotation = await this.repository.rotateRefreshToken({
            tokenHash: hashRefreshToken(token),
            nextTokenHash: hashRefreshToken(nextRefreshToken),
            now,
            refreshTokenTtlSeconds: ENV.REFRESH_TOKEN_TTL_SECONDS,
        })

        if (rotation.kind !== 'rotated') {
            throw new UnauthorizedError('Invalid or expired refresh token')
        }

        const accessToken = await signAccessToken({
            userId: rotation.user.id,
            role: rotation.user.role,
        })

        return {
            accessToken,
            refreshToken: nextRefreshToken,
            refreshTokenMaxAgeMs: instantDifferenceMs(
                rotation.refreshTokenExpiresAt,
                now,
            ),
        }
    }

    async logout(token: string): Promise<void> {
        await this.repository.revokeSessionByRefreshTokenHash(
            hashRefreshToken(token),
            Temporal.Now.instant(),
        )
    }

    async getMe(userId: string): Promise<AuthUser> {
        const user = await this.repository.findUserById(userId)
        if (!user) {
            throw new NotFoundError('User not found')
        }
        return user
    }
}

function minInstant(left: Temporal.Instant, right: Temporal.Instant) {
    return Temporal.Instant.compare(left, right) <= 0 ? left : right
}

function instantDifferenceMs(
    later: Temporal.Instant,
    earlier: Temporal.Instant,
) {
    return Math.max(
        0,
        Number(later.epochMilliseconds - earlier.epochMilliseconds),
    )
}
