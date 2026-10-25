import mongoose from 'mongoose'
import { Temporal } from 'temporal-polyfill/full'
import {
    EmailVerificationTokenModel,
    PasswordResetTokenModel,
    RefreshTokenModel,
    SessionModel,
    UserModel,
} from '../../mongo/models/index.js'
import type { AuthRepository } from './auth.repository.js'
import type {
    AuthUser,
    CreateSessionInput,
    CreateUserRecord,
    RotateRefreshTokenInput,
    RotateRefreshTokenResult,
    UserRecord,
} from './auth.types.js'

export class MongoAuthRepository implements AuthRepository {
    async findUserByEmail(email: string): Promise<UserRecord | null> {
        const user = await UserModel.findOne({ email }).lean()
        if (!user) return null

        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            passwordHash: user.passwordHash,
            emailVerifiedAt: user.emailVerifiedAt,
        }
    }

    async findUserById(id: string): Promise<AuthUser | null> {
        if (!mongoose.isValidObjectId(id)) return null

        const user = await UserModel.findById(id).lean()
        if (!user) return null

        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        }
    }

    async createUser(input: CreateUserRecord): Promise<AuthUser> {
        const user = await UserModel.create({
            email: input.email,
            passwordHash: input.passwordHash,
        })

        return {
            id: user._id.toString(),
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
        if (!mongoose.isValidObjectId(input.userId)) {
            throw new Error('Invalid user ID')
        }

        const userId = new mongoose.Types.ObjectId(input.userId)
        const createdDate = new Date(Number(input.createdAt.epochMilliseconds))
        const expiresDate = new Date(Number(input.expiresAt.epochMilliseconds))

        // Invalidate previous unconsumed verification tokens
        await EmailVerificationTokenModel.updateMany(
            { userId, consumedAt: null },
            { $set: { consumedAt: createdDate } },
        )

        await EmailVerificationTokenModel.create({
            userId,
            tokenHash: input.tokenHash,
            expiresAt: expiresDate,
            consumedAt: null,
        })
    }

    async verifyEmail(
        tokenHash: string,
        now: Temporal.Instant,
    ): Promise<boolean> {
        const nowDate = new Date(Number(now.epochMilliseconds))

        const token = await EmailVerificationTokenModel.findOneAndUpdate(
            {
                tokenHash,
                consumedAt: null,
                expiresAt: { $gt: nowDate },
            },
            { $set: { consumedAt: nowDate } },
            { new: true },
        )

        if (!token) return false

        await UserModel.updateOne(
            { _id: token.userId, emailVerifiedAt: null },
            { $set: { emailVerifiedAt: nowDate } },
        )

        return true
    }

    async createPasswordResetToken(input: {
        userId: string
        tokenHash: string
        expiresAt: Temporal.Instant
        createdAt: Temporal.Instant
    }): Promise<void> {
        if (!mongoose.isValidObjectId(input.userId)) {
            throw new Error('Invalid user ID')
        }

        const userId = new mongoose.Types.ObjectId(input.userId)
        const createdDate = new Date(Number(input.createdAt.epochMilliseconds))
        const expiresDate = new Date(Number(input.expiresAt.epochMilliseconds))

        // Invalidate previous unconsumed password reset tokens
        await PasswordResetTokenModel.updateMany(
            { userId, consumedAt: null },
            { $set: { consumedAt: createdDate } },
        )

        await PasswordResetTokenModel.create({
            userId,
            tokenHash: input.tokenHash,
            expiresAt: expiresDate,
            consumedAt: null,
        })
    }

    async resetPassword(input: {
        tokenHash: string
        newPasswordHash: string
        now: Temporal.Instant
    }): Promise<boolean> {
        const nowDate = new Date(Number(input.now.epochMilliseconds))

        const token = await PasswordResetTokenModel.findOneAndUpdate(
            {
                tokenHash: input.tokenHash,
                consumedAt: null,
                expiresAt: { $gt: nowDate },
            },
            { $set: { consumedAt: nowDate } },
            { new: true },
        )

        if (!token) return false

        await UserModel.updateOne(
            { _id: token.userId },
            { $set: { passwordHash: input.newPasswordHash } },
        )

        // Revoke all active sessions for this user
        await SessionModel.updateMany(
            { userId: token.userId, revokedAt: null },
            { $set: { revokedAt: nowDate } },
        )

        return true
    }

    async createSession(input: CreateSessionInput): Promise<void> {
        if (!mongoose.isValidObjectId(input.userId)) {
            throw new Error('Invalid user ID')
        }

        const session = await SessionModel.create({
            userId: new mongoose.Types.ObjectId(input.userId),
            deviceName: null,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            expiresAt: new Date(
                Number(input.sessionExpiresAt.epochMilliseconds),
            ),
        })

        await RefreshTokenModel.create({
            sessionId: session._id,
            tokenHash: input.refreshTokenHash,
            expiresAt: new Date(
                Number(input.refreshTokenExpiresAt.epochMilliseconds),
            ),
        })
    }

    async rotateRefreshToken(
        input: RotateRefreshTokenInput,
    ): Promise<RotateRefreshTokenResult> {
        const nowDate = new Date(Number(input.now.epochMilliseconds))

        const token = await RefreshTokenModel.findOne({
            tokenHash: input.tokenHash,
        })

        if (!token) return { kind: 'invalid' }

        const session = await SessionModel.findById(token.sessionId)
        if (!session || token.revokedAt || session.revokedAt) {
            return { kind: 'invalid' }
        }

        // Token reuse detection
        if (token.consumedAt) {
            const activeSession = await SessionModel.findOneAndUpdate(
                {
                    _id: session._id,
                    revokedAt: null,
                    expiresAt: { $gt: nowDate },
                },
                { $set: { revokedAt: nowDate, lastSeenAt: nowDate } },
                { new: true },
            )

            if (!activeSession) return { kind: 'invalid' }
            return { kind: 'reused' }
        }

        // Expiry check
        if (token.expiresAt <= nowDate || session.expiresAt <= nowDate) {
            return { kind: 'invalid' }
        }

        // Update session lastSeenAt
        const activeSession = await SessionModel.findOneAndUpdate(
            {
                _id: session._id,
                revokedAt: null,
                expiresAt: { $gt: nowDate },
            },
            { $set: { lastSeenAt: nowDate } },
            { new: true },
        )

        if (!activeSession) return { kind: 'invalid' }

        const user = await UserModel.findById(session.userId)
        if (!user || !user.isActive || !user.emailVerifiedAt) {
            await SessionModel.updateOne(
                { _id: session._id, revokedAt: null },
                { $set: { revokedAt: nowDate } },
            )
            return { kind: 'invalid' }
        }

        // Atomically consume token
        const consumed = await RefreshTokenModel.findOneAndUpdate(
            {
                _id: token._id,
                consumedAt: null,
                revokedAt: null,
                expiresAt: { $gt: nowDate },
            },
            { $set: { consumedAt: nowDate } },
            { new: true },
        )

        if (!consumed) {
            await SessionModel.updateOne(
                { _id: session._id, revokedAt: null },
                { $set: { revokedAt: nowDate } },
            )
            return { kind: 'reused' }
        }

        const rollingExpiry = input.now.add({
            seconds: input.refreshTokenTtlSeconds,
        })
        const sessionExpiresAtInstant = Temporal.Instant.fromEpochMilliseconds(
            session.expiresAt.getTime(),
        )
        const refreshTokenExpiresAt =
            Temporal.Instant.compare(rollingExpiry, sessionExpiresAtInstant) < 0
                ? rollingExpiry
                : sessionExpiresAtInstant

        await RefreshTokenModel.create({
            sessionId: session._id,
            tokenHash: input.nextTokenHash,
            expiresAt: new Date(
                Number(refreshTokenExpiresAt.epochMilliseconds),
            ),
        })

        return {
            kind: 'rotated',
            user: { id: user._id.toString(), role: user.role },
            refreshTokenExpiresAt,
        }
    }

    async revokeSessionByRefreshTokenHash(
        tokenHash: string,
        revokedAt: Temporal.Instant,
    ): Promise<void> {
        const token = await RefreshTokenModel.findOne({ tokenHash })
        if (!token) return

        const revokedDate = new Date(Number(revokedAt.epochMilliseconds))

        await SessionModel.updateOne(
            { _id: token.sessionId, revokedAt: null },
            { $set: { revokedAt: revokedDate } },
        )
    }
}
