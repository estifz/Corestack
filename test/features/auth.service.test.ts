import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from '../../src/features/auth/auth.service.js'
import type { AuthRepository } from '../../src/features/auth/auth.repository.js'
import type {
    AuthUser,
    UserRecord,
} from '../../src/features/auth/auth.types.js'

const { sendVerificationEmail, verifyPassword } = vi.hoisted(() => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    verifyPassword: vi.fn(
        async (_hash: string, password: string) =>
            password === 'correct-password',
    ),
}))

vi.mock('../../src/features/auth/auth.email.js', () => ({
    sendVerificationEmail,
}))
vi.mock('argon2', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('argon2-test-hash'),
        verify: verifyPassword,
    },
}))

const verifiedUser: UserRecord = {
    id: 'user-1',
    email: 'person@example.com',
    role: 'USER',
    isActive: true,
    passwordHash: 'hashed-password',
    emailVerifiedAt: new Date(),
}

function makeRepository(overrides: Partial<AuthRepository> = {}) {
    const repository: AuthRepository = {
        findUserByEmail: vi.fn().mockResolvedValue(null),
        findUserById: vi.fn().mockResolvedValue(null),
        createUser: vi.fn().mockResolvedValue({
            id: 'user-1',
            email: 'person@example.com',
            role: 'USER',
            isActive: true,
        } satisfies AuthUser),
        createEmailVerificationToken: vi.fn().mockResolvedValue(undefined),
        verifyEmail: vi.fn().mockResolvedValue(false),
        createSession: vi.fn().mockResolvedValue(undefined),
        rotateRefreshToken: vi.fn().mockResolvedValue({ kind: 'invalid' }),
        revokeSessionByRefreshTokenHash: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    }
    return repository
}

describe('AuthService', () => {
    beforeEach(() => {
        sendVerificationEmail.mockClear()
        verifyPassword.mockClear()
        verifyPassword.mockImplementation(
            async (_hash, password) => password === 'correct-password',
        )
    })

    it('normalizes registration email, stores a password hash and sends verification', async () => {
        const repository = makeRepository()
        const service = new AuthService(repository)

        const result = await service.register({
            email: ' Person@Example.com ',
            password: 'very-secret',
        })

        expect(repository.findUserByEmail).toHaveBeenCalledWith(
            'person@example.com',
        )
        expect(repository.createUser).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'person@example.com',
                passwordHash: expect.not.stringMatching(/^very-secret$/),
            }),
        )
        expect(repository.createEmailVerificationToken).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'user-1' }),
        )
        expect(sendVerificationEmail).toHaveBeenCalledWith(
            'person@example.com',
            expect.any(String),
        )
        expect(result.id).toBe('user-1')
    })

    it('rejects registration when the email already exists', async () => {
        const repository = makeRepository({
            findUserByEmail: vi.fn().mockResolvedValue(verifiedUser),
        })
        const service = new AuthService(repository)

        await expect(
            service.register({
                email: 'PERSON@example.com',
                password: 'very-secret',
            }),
        ).rejects.toThrow('already exists')
        expect(repository.createUser).not.toHaveBeenCalled()
        expect(sendVerificationEmail).not.toHaveBeenCalled()
    })

    it('creates a session and returns tokens for a verified active user', async () => {
        const repository = makeRepository({
            findUserByEmail: vi.fn().mockResolvedValue(verifiedUser),
        })
        const service = new AuthService(repository)

        const result = await service.login(
            { email: ' PERSON@example.com ', password: 'correct-password' },
            { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
        )

        expect(repository.createSession).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-1',
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
            }),
        )
        expect(result.accessToken).toEqual(expect.any(String))
        expect(result.refreshToken).toEqual(expect.any(String))
        expect(result.refreshTokenMaxAgeMs).toBeGreaterThan(0)
    })

    it('rejects unknown users and unverified accounts at login', async () => {
        const missing = new AuthService(makeRepository())
        await expect(
            missing.login(
                { email: 'missing@example.com', password: 'x' },
                { ipAddress: null, userAgent: null },
            ),
        ).rejects.toThrow('Invalid credentials')

        const unverified = new AuthService(
            makeRepository({
                findUserByEmail: vi.fn().mockResolvedValue({
                    ...verifiedUser,
                    emailVerifiedAt: null,
                }),
            }),
        )
        await expect(
            unverified.login(
                { email: verifiedUser.email, password: 'correct-password' },
                { ipAddress: null, userAgent: null },
            ),
        ).rejects.toThrow('not verified')
    })

    it('rejects inactive accounts and incorrect passwords', async () => {
        const inactive = new AuthService(
            makeRepository({
                findUserByEmail: vi
                    .fn()
                    .mockResolvedValue({ ...verifiedUser, isActive: false }),
            }),
        )
        await expect(
            inactive.login(
                { email: verifiedUser.email, password: 'correct-password' },
                { ipAddress: null, userAgent: null },
            ),
        ).rejects.toThrow('inactive')

        const wrongPassword = new AuthService(
            makeRepository({
                findUserByEmail: vi.fn().mockResolvedValue(verifiedUser),
            }),
        )
        await expect(
            wrongPassword.login(
                { email: verifiedUser.email, password: 'wrong-password' },
                { ipAddress: null, userAgent: null },
            ),
        ).rejects.toThrow('Invalid credentials')
    })

    it('rejects invalid refresh tokens and revokes sessions on logout', async () => {
        const repository = makeRepository()
        const service = new AuthService(repository)

        await expect(service.refresh('opaque-token')).rejects.toThrow(
            'Invalid or expired',
        )
        await service.logout('opaque-token')

        expect(repository.rotateRefreshToken).toHaveBeenCalledWith(
            expect.objectContaining({
                tokenHash: expect.not.stringMatching('opaque-token'),
            }),
        )
        expect(repository.revokeSessionByRefreshTokenHash).toHaveBeenCalledWith(
            expect.not.stringMatching('opaque-token'),
            expect.anything(),
        )
    })

    it('returns the user or reports a missing account', async () => {
        const repository = makeRepository({
            findUserById: vi.fn().mockResolvedValue(verifiedUser),
        })
        await expect(
            new AuthService(repository).getMe('user-1'),
        ).resolves.toEqual(verifiedUser)

        const missing = new AuthService(makeRepository())
        await expect(missing.getMe('missing')).rejects.toThrow('User not found')
    })
})
