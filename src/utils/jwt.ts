import { errors, jwtVerify, SignJWT } from 'jose'
import { ENV } from '../config/env.js'
import { UnauthorizedError } from './errors/appError.js'

export type UserRole = 'USER' | 'ADMIN'

export interface SignAccessTokenInput {
    userId: string
    role: UserRole
}

export interface VerifiedAccessTokenPayload {
    sub: string
    role: UserRole
    iat?: number
    exp?: number
}

export type AccessTokenPayload = SignAccessTokenInput
export type AccessTokenClaims = VerifiedAccessTokenPayload

function getSecretKey(): Uint8Array {
    return new TextEncoder().encode(ENV.JWT_SECRET)
}

export async function signAccessToken(
    input: SignAccessTokenInput,
): Promise<string> {
    const secret = getSecretKey()

    return new SignJWT({ role: input.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(input.userId)
        .setIssuedAt()
        .setExpirationTime(ENV.JWT_EXPIRES_IN)
        .sign(secret)
}

export async function verifyAccessToken(
    token: string,
): Promise<VerifiedAccessTokenPayload> {
    try {
        const secret = getSecretKey()
        const { payload } = await jwtVerify(token, secret)

        if (!payload.sub || typeof payload.sub !== 'string') {
            throw new UnauthorizedError('Invalid access token: missing subject')
        }

        const role = payload['role']
        if (role !== 'USER' && role !== 'ADMIN') {
            throw new UnauthorizedError(
                'Invalid access token: invalid role claim',
            )
        }

        const verifiedPayload: VerifiedAccessTokenPayload = {
            sub: payload.sub,
            role,
        }

        if (typeof payload.iat === 'number') {
            verifiedPayload.iat = payload.iat
        }

        if (typeof payload.exp === 'number') {
            verifiedPayload.exp = payload.exp
        }

        return verifiedPayload
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            throw error
        }
        if (error instanceof errors.JWTExpired) {
            throw new UnauthorizedError('Access token has expired')
        }
        throw new UnauthorizedError('Invalid access token')
    }
}
