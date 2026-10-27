import { Temporal } from 'temporal-polyfill/full'
import { prisma } from '../../prisma/db.js'
import type { AuthRepository } from './auth.repository.js'
import type {
    AuthUser,
    CreateSessionInput,
    CreateUserRecord,
    RotateRefreshTokenInput,
    RotateRefreshTokenResult,
    UserRecord,
} from './auth.types.js'

export class PrismaAuthRepository implements AuthRepository {
    async findUserByEmail(email: string): Promise<UserRecord | null> {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                passwordHash: true,
                emailVerifiedAt: true,
            },
        })
        if (!user) return null

        return {
            id: user.id,
            email: user.email,
            role: user.role as 'USER' | 'ADMIN',
            isActive: user.isActive,
            passwordHash: user.passwordHash,
            emailVerifiedAt: user.emailVerifiedAt
                ? Temporal.Instant.fromEpochMilliseconds(
                      user.emailVerifiedAt.getTime(),
                  )
                : null,
        }
    }

    async findUserById(id: string): Promise<AuthUser | null> {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
            },
        })
        if (!user) return null

        return {
            id: user.id,
            email: user.email,
            role: user.role as 'USER' | 'ADMIN',
            isActive: user.isActive,
        }
    }

    async createUser(input: CreateUserRecord): Promise<AuthUser> {
        const user = await prisma.user.create({
            data: {
                email: input.email,
                passwordHash: input.passwordHash,
            },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
            },
        })

        return {
            id: user.id,
            email: user.email,
            role: user.role as 'USER' | 'ADMIN',
            isActive: user.isActive,
        }
    }

    async createEmailVerificationToken(input: {
        userId: string
        tokenHash: string
        expiresAt: Temporal.Instant
        createdAt: Temporal.Instant
    }): Promise<void> {
        await prisma.$transaction(async (tx) => {
            await tx.emailVerificationToken.updateMany({
                where: {
                    userId: input.userId,
                    consumedAt: null,
                },
                data: {
                    consumedAt: new Date(input.createdAt.epochMilliseconds),
                },
            })
            await tx.emailVerificationToken.create({
                data: {
                    userId: input.userId,
                    tokenHash: input.tokenHash,
                    expiresAt: new Date(input.expiresAt.epochMilliseconds),
                    createdAt: new Date(input.createdAt.epochMilliseconds),
                },
            })
        })
    }

    async verifyEmail(
        tokenHash: string,
        now: Temporal.Instant,
    ): Promise<boolean> {
        return prisma.$transaction(async (tx) => {
            const nowDate = new Date(now.epochMilliseconds)
            const token = await tx.emailVerificationToken.findFirst({
                where: {
                    tokenHash,
                    consumedAt: null,
                    expiresAt: { gt: nowDate },
                },
            })
            if (!token) return false

            await tx.emailVerificationToken.update({
                where: { id: token.id },
                data: { consumedAt: nowDate },
            })

            await tx.user.updateMany({
                where: {
                    id: token.userId,
                    emailVerifiedAt: null,
                },
                data: {
                    emailVerifiedAt: nowDate,
                },
            })
            return true
        })
    }

    async createPasswordResetToken(input: {
        userId: string
        tokenHash: string
        expiresAt: Temporal.Instant
        createdAt: Temporal.Instant
    }): Promise<void> {
        await prisma.$transaction(async (tx) => {
            await tx.passwordResetToken.updateMany({
                where: {
                    userId: input.userId,
                    consumedAt: null,
                },
                data: {
                    consumedAt: new Date(input.createdAt.epochMilliseconds),
                },
            })
            await tx.passwordResetToken.create({
                data: {
                    userId: input.userId,
                    tokenHash: input.tokenHash,
                    expiresAt: new Date(input.expiresAt.epochMilliseconds),
                    createdAt: new Date(input.createdAt.epochMilliseconds),
                },
            })
        })
    }

    async resetPassword(input: {
        tokenHash: string
        newPasswordHash: string
        now: Temporal.Instant
    }): Promise<boolean> {
        return prisma.$transaction(async (tx) => {
            const nowDate = new Date(input.now.epochMilliseconds)
            const token = await tx.passwordResetToken.findFirst({
                where: {
                    tokenHash: input.tokenHash,
                    consumedAt: null,
                    expiresAt: { gt: nowDate },
                },
            })
            if (!token) return false

            await tx.passwordResetToken.update({
                where: { id: token.id },
                data: { consumedAt: nowDate },
            })

            await tx.user.update({
                where: { id: token.userId },
                data: { passwordHash: input.newPasswordHash },
            })

            await tx.session.updateMany({
                where: {
                    userId: token.userId,
                    revokedAt: null,
                },
                data: {
                    revokedAt: nowDate,
                },
            })

            return true
        })
    }

    async createSession(input: CreateSessionInput): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const session = await tx.session.create({
                data: {
                    userId: input.userId,
                    deviceName: null,
                    ipAddress: input.ipAddress,
                    userAgent: input.userAgent,
                    expiresAt: new Date(
                        input.sessionExpiresAt.epochMilliseconds,
                    ),
                },
            })

            await tx.refreshToken.create({
                data: {
                    sessionId: session.id,
                    tokenHash: input.refreshTokenHash,
                    expiresAt: new Date(
                        input.refreshTokenExpiresAt.epochMilliseconds,
                    ),
                },
            })
        })
    }

    async rotateRefreshToken(
        input: RotateRefreshTokenInput,
    ): Promise<RotateRefreshTokenResult> {
        return prisma.$transaction(async (tx) => {
            const token = await tx.refreshToken.findUnique({
                where: { tokenHash: input.tokenHash },
                include: {
                    session: {
                        select: {
                            id: true,
                            userId: true,
                            expiresAt: true,
                            revokedAt: true,
                        },
                    },
                },
            })

            if (
                !token ||
                !token.session ||
                token.revokedAt ||
                token.session.revokedAt
            ) {
                return { kind: 'invalid' }
            }
            const session = token.session
            const nowDate = new Date(input.now.epochMilliseconds)

            if (token.consumedAt) {
                const activeSession = await tx.session.findFirst({
                    where: {
                        id: session.id,
                        revokedAt: null,
                        expiresAt: { gt: nowDate },
                    },
                })

                if (!activeSession) return { kind: 'invalid' }

                await tx.session.update({
                    where: { id: session.id },
                    data: {
                        lastSeenAt: nowDate,
                        revokedAt: nowDate,
                    },
                })
                return { kind: 'reused' }
            }

            if (token.expiresAt <= nowDate || session.expiresAt <= nowDate) {
                return { kind: 'invalid' }
            }

            // Lock session row and update lastSeenAt
            const activeSession = await tx.session.findFirst({
                where: {
                    id: session.id,
                    revokedAt: null,
                    expiresAt: { gt: nowDate },
                },
            })

            if (!activeSession) return { kind: 'invalid' }

            await tx.session.update({
                where: { id: session.id },
                data: { lastSeenAt: nowDate },
            })

            const user = await tx.user.findUnique({
                where: { id: session.userId },
                select: {
                    id: true,
                    role: true,
                    isActive: true,
                    emailVerifiedAt: true,
                },
            })

            if (!user || !user.isActive || !user.emailVerifiedAt) {
                await tx.session.update({
                    where: { id: session.id },
                    data: { revokedAt: nowDate },
                })
                return { kind: 'invalid' }
            }

            const consumeResult = await tx.refreshToken.updateMany({
                where: {
                    id: token.id,
                    consumedAt: null,
                    revokedAt: null,
                    expiresAt: { gt: nowDate },
                },
                data: { consumedAt: nowDate },
            })

            if (consumeResult.count === 0) {
                await tx.session.update({
                    where: { id: session.id },
                    data: { revokedAt: nowDate },
                })
                return { kind: 'reused' }
            }

            const sessionExpiresInstant =
                Temporal.Instant.fromEpochMilliseconds(
                    session.expiresAt.getTime(),
                )
            const rollingExpiry = input.now.add({
                seconds: input.refreshTokenTtlSeconds,
            })
            const refreshTokenExpiresAt =
                Temporal.Instant.compare(rollingExpiry, sessionExpiresInstant) <
                0
                    ? rollingExpiry
                    : sessionExpiresInstant

            await tx.refreshToken.create({
                data: {
                    sessionId: session.id,
                    tokenHash: input.nextTokenHash,
                    expiresAt: new Date(
                        refreshTokenExpiresAt.epochMilliseconds,
                    ),
                },
            })

            return {
                kind: 'rotated',
                user: { id: user.id, role: user.role as 'USER' | 'ADMIN' },
                refreshTokenExpiresAt,
            }
        })
    }

    async revokeSessionByRefreshTokenHash(
        tokenHash: string,
        revokedAt: Temporal.Instant,
    ): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const token = await tx.refreshToken.findUnique({
                where: { tokenHash },
                select: { sessionId: true },
            })
            if (!token) return

            await tx.session.updateMany({
                where: {
                    id: token.sessionId,
                    revokedAt: null,
                },
                data: {
                    revokedAt: new Date(revokedAt.epochMilliseconds),
                },
            })
        })
    }
}
