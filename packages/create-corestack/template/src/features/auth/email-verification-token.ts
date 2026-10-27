import { createHash, randomBytes } from 'node:crypto'

export function createEmailVerificationToken() {
    const token = randomBytes(32).toString('base64url')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    return { token, tokenHash }
}

export function hashEmailVerificationToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
}
