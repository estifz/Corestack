import { describe, expect, it } from 'vitest'
import { signAccessToken, verifyAccessToken } from '../../src/utils/jwt.js'
import { UnauthorizedError } from '../../src/utils/errors/appError.js'

describe('access tokens', () => {
    it('signs and verifies the user identity and role', async () => {
        const token = await signAccessToken({
            userId: 'user-123',
            role: 'USER',
        })

        await expect(verifyAccessToken(token)).resolves.toMatchObject({
            sub: 'user-123',
            role: 'USER',
        })
    })

    it('rejects a token with an invalid signature', async () => {
        await expect(verifyAccessToken('not-a-jwt')).rejects.toBeInstanceOf(
            UnauthorizedError,
        )
    })

    it('rejects an expired token', async () => {
        const { SignJWT } = await import('jose')
        const expired = await new SignJWT({ role: 'USER' })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject('user-123')
            .setExpirationTime('0s')
            .sign(new TextEncoder().encode(process.env.JWT_SECRET))

        await expect(verifyAccessToken(expired)).rejects.toThrow(
            'Access token has expired',
        )
    })
})
