import { describe, expect, it } from 'vitest'
import {
    loginUserSchema,
    registerUserSchema,
    resendVerificationEmailSchema,
    verifyEmailSchema,
} from '../../src/features/auth/auth.validation.js'

describe('auth request validation', () => {
    it('accepts a valid registration and rejects a short password', () => {
        expect(
            registerUserSchema.safeParse({
                email: 'user@example.com',
                password: 'long-enough',
            }).success,
        ).toBe(true)
        expect(
            registerUserSchema.safeParse({
                email: 'user@example.com',
                password: 'short',
            }).success,
        ).toBe(false)
    })

    it('requires a valid email and non-empty login password', () => {
        expect(
            loginUserSchema.safeParse({ email: 'bad-email', password: 'x' })
                .success,
        ).toBe(false)
        expect(
            loginUserSchema.safeParse({
                email: 'user@example.com',
                password: '',
            }).success,
        ).toBe(false)
    })

    it('validates email resend addresses and verification token format', () => {
        expect(
            resendVerificationEmailSchema.safeParse({
                email: 'user@example.com',
            }).success,
        ).toBe(true)
        expect(
            resendVerificationEmailSchema.safeParse({ email: 'bad-email' })
                .success,
        ).toBe(false)
        expect(
            verifyEmailSchema.safeParse({ token: 'a'.repeat(43) }).success,
        ).toBe(true)
        expect(verifyEmailSchema.safeParse({ token: 'short' }).success).toBe(
            false,
        )
    })
})
