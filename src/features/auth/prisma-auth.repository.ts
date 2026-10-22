import { Temporal } from 'temporal-polyfill/full'
import { db } from '../../prisma/db.js'
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
        return db.orm.auth.User.select(
            'id',
            'email',
            'role',
            'isActive',
            'passwordHash',
            'emailVerifiedAt',
        ).first({
            email,
        })
    }

    async findUserById(id: string): Promise<AuthUser | null> {
        return db.orm.auth.User.select('id', 'email', 'role', 'isActive').first(
            {
                id,
            },
        )
    }

    async createUser(input: CreateUserRecord): Promise<AuthUser> {
        const user = await db.orm.auth.User.create({
            email: input.email,
            passwordHash: input.passwordHash,
        })

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        }
    }

    async createEmailVerificationToken(input: {
        userId: string
        tokenHash: string
        expiresAt: Temporal.Instant
        createdAt: Temporal.Instant
    }): Promise<void> {
        await db.transaction(async (tx) => {
            await tx.execute(
                tx.sql.auth.email_verification_tokens
                    .update({ consumedAt: input.createdAt })
                    .where((fields, fns) => fns.eq(fields.userId, input.userId))
                    .where((fields, fns) => fns.eq(fields.consumedAt, null))
                    .build(),
            )
            await tx.orm.auth.EmailVerificationToken.create({
                userId: input.userId,
                tokenHash: input.tokenHash,
                expiresAt: input.expiresAt,
            })
        })
    }

    async verifyEmail(
        tokenHash: string,
        now: Temporal.Instant,
    ): Promise<boolean> {
        return db.transaction(async (tx) => {
            const consumed = await tx.query(
                tx.sql.auth.email_verification_tokens
                    .update({ consumedAt: now })
                    .where((fields, fns) => fns.eq(fields.tokenHash, tokenHash))
                    .where((fields, fns) => fns.eq(fields.consumedAt, null))
                    .where((fields, fns) => fns.gt(fields.expiresAt, now))
                    .returning('userId')
                    .build(),
            )
            if (consumed.length === 0) return false

            await tx.execute(
                tx.sql.auth.users
                    .update({ emailVerifiedAt: now })
                    .where((fields, fns) =>
                        fns.eq(fields.id, consumed[0]!.userId),
                    )
                    .where((fields, fns) =>
                        fns.eq(fields.emailVerifiedAt, null),
                    )
                    .build(),
            )
            return true
        })
    }

    async createSession(input: CreateSessionInput): Promise<void> {
        await db.transaction(async (tx) => {
            const session = await tx.orm.auth.Session.create({
                userId: input.userId,
                deviceName: null,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                expiresAt: input.sessionExpiresAt,
            })

            await tx.orm.auth.RefreshToken.create({
                sessionId: session.id,
                tokenHash: input.refreshTokenHash,
                expiresAt: input.refreshTokenExpiresAt,
            })
        })
    }

    async rotateRefreshToken(
        input: RotateRefreshTokenInput,
    ): Promise<RotateRefreshTokenResult> {
        return db.transaction(async (tx) => {
            const token = await tx.orm.auth.RefreshToken.include(
                'session',
                (session) =>
                    session.select('id', 'userId', 'expiresAt', 'revokedAt'),
            ).first({ tokenHash: input.tokenHash })

            if (
                !token ||
                !token.session ||
                token.revokedAt ||
                token.session.revokedAt
            ) {
                return { kind: 'invalid' }
            }
            const session = token.session

            if (token.consumedAt) {
                const activeSession = await tx.query(
                    tx.sql.auth.sessions
                        .update({ lastSeenAt: input.now })
                        .where((fields, fns) => fns.eq(fields.id, session.id))
                        .where((fields, fns) => fns.eq(fields.revokedAt, null))
                        .where((fields, fns) =>
                            fns.gt(fields.expiresAt, input.now),
                        )
                        .returning('id')
                        .build(),
                )

                if (activeSession.length === 0) return { kind: 'invalid' }

                await tx.execute(
                    tx.sql.auth.sessions
                        .update({ revokedAt: input.now })
                        .where((fields, fns) => fns.eq(fields.id, session.id))
                        .where((fields, fns) => fns.eq(fields.revokedAt, null))
                        .build(),
                )
                return { kind: 'reused' }
            }

            if (
                Temporal.Instant.compare(token.expiresAt, input.now) <= 0 ||
                Temporal.Instant.compare(session.expiresAt, input.now) <= 0
            ) {
                return { kind: 'invalid' }
            }

            // This conditional update locks the session row. Concurrent refreshes
            // for the same session serialize here, so reuse of the old token is
            // detected when the second request attempts to consume it.
            const activeSession = await tx.query(
                tx.sql.auth.sessions
                    .update({ lastSeenAt: input.now })
                    .where((fields, fns) => fns.eq(fields.id, session.id))
                    .where((fields, fns) => fns.eq(fields.revokedAt, null))
                    .where((fields, fns) => fns.gt(fields.expiresAt, input.now))
                    .returning('id')
                    .build(),
            )

            if (activeSession.length === 0) return { kind: 'invalid' }

            const user = await tx.orm.auth.User.select(
                'id',
                'role',
                'isActive',
                'emailVerifiedAt',
            ).first({ id: session.userId })

            if (!user || !user.isActive || !user.emailVerifiedAt) {
                await tx.execute(
                    tx.sql.auth.sessions
                        .update({ revokedAt: input.now })
                        .where((fields, fns) => fns.eq(fields.id, session.id))
                        .where((fields, fns) => fns.eq(fields.revokedAt, null))
                        .build(),
                )
                return { kind: 'invalid' }
            }

            const consumed = await tx.query(
                tx.sql.auth.refresh_tokens
                    .update({ consumedAt: input.now })
                    .where((fields, fns) => fns.eq(fields.id, token.id))
                    .where((fields, fns) => fns.eq(fields.consumedAt, null))
                    .where((fields, fns) => fns.eq(fields.revokedAt, null))
                    .where((fields, fns) => fns.gt(fields.expiresAt, input.now))
                    .returning('id')
                    .build(),
            )

            if (consumed.length === 0) {
                await tx.execute(
                    tx.sql.auth.sessions
                        .update({ revokedAt: input.now })
                        .where((fields, fns) => fns.eq(fields.id, session.id))
                        .where((fields, fns) => fns.eq(fields.revokedAt, null))
                        .build(),
                )
                return { kind: 'reused' }
            }

            const rollingExpiry = input.now.add({
                seconds: input.refreshTokenTtlSeconds,
            })
            const refreshTokenExpiresAt =
                Temporal.Instant.compare(rollingExpiry, session.expiresAt) < 0
                    ? rollingExpiry
                    : session.expiresAt

            await tx.orm.auth.RefreshToken.create({
                sessionId: session.id,
                tokenHash: input.nextTokenHash,
                expiresAt: refreshTokenExpiresAt,
            })

            return {
                kind: 'rotated',
                user: { id: user.id, role: user.role },
                refreshTokenExpiresAt,
            }
        })
    }

    async revokeSessionByRefreshTokenHash(
        tokenHash: string,
        revokedAt: Temporal.Instant,
    ): Promise<void> {
        await db.transaction(async (tx) => {
            const token = await tx.orm.auth.RefreshToken.select(
                'sessionId',
            ).first({
                tokenHash,
            })
            if (!token) return

            await tx.execute(
                tx.sql.auth.sessions
                    .update({ revokedAt })
                    .where((fields, fns) => fns.eq(fields.id, token.sessionId))
                    .where((fields, fns) => fns.eq(fields.revokedAt, null))
                    .build(),
            )
        })
    }
}
