import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from '../../src/features/auth/auth.service.js'
import type { AuthRepository } from '../../src/features/auth/auth.repository.js'
import { BadRequestError } from '../../src/utils/errors/appError.js'
import * as authEmail from '../../src/features/auth/auth.email.js'

describe('Password Reset', () => {
    let mockRepo: Partial<AuthRepository>

    beforeEach(() => {
        vi.restoreAllMocks()
        mockRepo = {
            findUserByEmail: vi.fn(),
            createPasswordResetToken: vi.fn().mockResolvedValue(undefined),
            resetPassword: vi.fn(),
        }
    })

    describe('forgotPassword', () => {
        it('silently ignores non-existent emails to prevent account enumeration', async () => {
            const sendEmailSpy = vi
                .spyOn(authEmail, 'sendPasswordResetEmail')
                .mockResolvedValue(undefined)

            vi.mocked(mockRepo.findUserByEmail!).mockResolvedValue(null)
            const service = new AuthService(mockRepo as AuthRepository)

            await expect(
                service.forgotPassword('nonexistent@example.com'),
            ).resolves.toBeUndefined()

            expect(mockRepo.createPasswordResetToken).not.toHaveBeenCalled()
            expect(sendEmailSpy).not.toHaveBeenCalled()
        })

        it('creates a token and sends an email for existing active users', async () => {
            const sendEmailSpy = vi
                .spyOn(authEmail, 'sendPasswordResetEmail')
                .mockResolvedValue(undefined)

            vi.mocked(mockRepo.findUserByEmail!).mockResolvedValue({
                id: 'user-123',
                email: 'user@example.com',
                passwordHash: 'hashed-pwd',
                role: 'USER',
                isActive: true,
                emailVerifiedAt: null,
            })

            const service = new AuthService(mockRepo as AuthRepository)
            await service.forgotPassword('user@example.com')

            expect(mockRepo.createPasswordResetToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-123',
                    tokenHash: expect.any(String),
                }),
            )
            expect(sendEmailSpy).toHaveBeenCalledWith(
                'user@example.com',
                expect.any(String),
            )
        })
    })

    describe('resetPassword', () => {
        it('hashes the new password and delegates to repository', async () => {
            vi.mocked(mockRepo.resetPassword!).mockResolvedValue(true)
            const service = new AuthService(mockRepo as AuthRepository)

            await expect(
                service.resetPassword(
                    'some-valid-token',
                    'new-secure-password',
                ),
            ).resolves.toBeUndefined()

            expect(mockRepo.resetPassword).toHaveBeenCalledWith(
                expect.objectContaining({
                    tokenHash: expect.any(String),
                    newPasswordHash: expect.any(String),
                }),
            )
        })

        it('throws BadRequestError if token is invalid or expired', async () => {
            vi.mocked(mockRepo.resetPassword!).mockResolvedValue(false)
            const service = new AuthService(mockRepo as AuthRepository)

            await expect(
                service.resetPassword('expired-token', 'new-secure-password'),
            ).rejects.toBeInstanceOf(BadRequestError)
        })
    })
})
