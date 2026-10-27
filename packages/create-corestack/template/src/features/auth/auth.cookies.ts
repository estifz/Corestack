import type { Request, Response } from 'express'
import { ENV } from '../../config/env.js'

const REFRESH_COOKIE_PATH = '/api/v1/auth'

export function readRefreshToken(req: Request): string | null {
    const cookieHeader = req.headers.cookie
    if (!cookieHeader) return null

    const cookie = cookieHeader
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${ENV.REFRESH_COOKIE_NAME}=`))

    if (!cookie) return null

    const value = cookie.slice(ENV.REFRESH_COOKIE_NAME.length + 1)
    try {
        return decodeURIComponent(value) || null
    } catch {
        return null
    }
}

export function setRefreshCookie(
    res: Response,
    token: string,
    maxAgeMs: number,
): void {
    res.cookie(ENV.REFRESH_COOKIE_NAME, token, {
        ...refreshCookieOptions(),
        maxAge: maxAgeMs,
    })
}

export function clearRefreshCookie(res: Response): void {
    res.clearCookie(ENV.REFRESH_COOKIE_NAME, refreshCookieOptions())
}

function refreshCookieOptions() {
    return {
        httpOnly: true,
        secure: ENV.REFRESH_COOKIE_SECURE,
        sameSite: ENV.REFRESH_COOKIE_SAME_SITE,
        path: REFRESH_COOKIE_PATH,
    } as const
}
