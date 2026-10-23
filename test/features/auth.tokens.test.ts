import { describe, expect, it } from 'vitest'
import {
    createEmailVerificationToken,
    hashEmailVerificationToken,
} from '../../src/features/auth/email-verification-token.js'
import {
    createRefreshToken,
    hashRefreshToken,
} from '../../src/features/auth/refresh-token.js'

describe('opaque auth tokens', () => {
    it('creates a verifiable email token and stores only its hash', () => {
        const { token, tokenHash } = createEmailVerificationToken()
        expect(token).toMatch(/^[A-Za-z0-9_-]{40,50}$/)
        expect(tokenHash).not.toBe(token)
        expect(hashEmailVerificationToken(token)).toBe(tokenHash)
    })

    it('hashes refresh tokens consistently without exposing the token', () => {
        const token = createRefreshToken()
        expect(token).toMatch(/^[A-Za-z0-9_-]{40,50}$/)
        expect(hashRefreshToken(token)).toHaveLength(64)
        expect(hashRefreshToken(token)).not.toBe(token)
        expect(hashRefreshToken(token)).toBe(hashRefreshToken(token))
    })
})
