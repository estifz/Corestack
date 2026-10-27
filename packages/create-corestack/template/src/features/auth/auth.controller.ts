import type { Request, Response } from 'express'
import { UnauthorizedError } from '../../utils/errors/appError.js'
import type { AuthService } from './auth.service.js'
import {
    forgotPasswordSchema,
    loginUserSchema,
    registerUserSchema,
    resendVerificationEmailSchema,
    resetPasswordSchema,
    verifyEmailSchema,
} from './auth.validation.js'
import {
    clearRefreshCookie,
    readRefreshToken,
    setRefreshCookie,
} from './auth.cookies.js'

export class AuthController {
    constructor(private readonly service: AuthService) {}

    async register(req: Request, res: Response) {
        const input = registerUserSchema.parse(req.body)
        const user = await this.service.register(input)

        res.status(201).json({
            success: true,
            message: 'Check your email for a verification link.',
            user,
        })
    }

    async showEmailVerification(req: Request, res: Response) {
        res.set({
            'Cache-Control': 'no-store',
            'Referrer-Policy': 'no-referrer',
        })
        const token = verifyEmailSchema.shape.token.safeParse(req.query.token)
        if (!token.success) {
            return res
                .status(400)
                .type('html')
                .send(
                    verificationPage(
                        'This verification link is invalid or incomplete.',
                        null,
                    ),
                )
        }
        return res.type('html').send(verificationPage(null, token.data))
    }

    async verifyEmail(req: Request, res: Response) {
        const { token } = verifyEmailSchema.parse(req.body)
        const verified = await this.service.verifyEmail(token)
        if (!verified) {
            return res
                .status(400)
                .type('html')
                .send(
                    verificationPage(
                        'This link is invalid, expired, or already used.',
                        null,
                    ),
                )
        }
        return res
            .status(200)
            .type('html')
            .send(
                verificationPage(
                    'Your email has been verified. You can now sign in.',
                    null,
                ),
            )
    }

    async resendVerificationEmail(req: Request, res: Response) {
        const { email } = resendVerificationEmailSchema.parse(req.body)
        await this.service.resendVerificationEmail(email)
        res.status(202).json({
            success: true,
            message:
                'If the account needs verification, a link will be sent shortly.',
        })
    }

    async forgotPassword(req: Request, res: Response) {
        const { email } = forgotPasswordSchema.parse(req.body)
        await this.service.forgotPassword(email)
        res.status(200).json({
            success: true,
            message:
                'If an account with that email exists, a password reset link has been sent.',
        })
    }

    async resetPassword(req: Request, res: Response) {
        const { token, password } = resetPasswordSchema.parse(req.body)
        await this.service.resetPassword(token, password)
        res.status(200).json({
            success: true,
            message:
                'Password has been reset successfully. You can now sign in with your new password.',
        })
    }

    async login(req: Request, res: Response) {
        const input = loginUserSchema.parse(req.body)
        const result = await this.service.login(input, {
            ipAddress: req.ip || null,
            userAgent: req.get('user-agent') || null,
        })

        setRefreshCookie(res, result.refreshToken, result.refreshTokenMaxAgeMs)

        res.status(200).json({
            success: true,
            user: result.user,
            accessToken: result.accessToken,
        })
    }

    async refresh(req: Request, res: Response) {
        const refreshToken = readRefreshToken(req)
        if (!refreshToken) {
            clearRefreshCookie(res)
            throw new UnauthorizedError('Refresh token is required')
        }

        try {
            const result = await this.service.refresh(refreshToken)
            setRefreshCookie(
                res,
                result.refreshToken,
                result.refreshTokenMaxAgeMs,
            )
            res.status(200).json({
                success: true,
                accessToken: result.accessToken,
            })
        } catch (error) {
            if (error instanceof UnauthorizedError) clearRefreshCookie(res)
            throw error
        }
    }

    async logout(req: Request, res: Response) {
        const refreshToken = readRefreshToken(req)
        if (refreshToken) await this.service.logout(refreshToken)
        clearRefreshCookie(res)

        res.status(200).json({ success: true })
    }

    async me(req: Request, res: Response) {
        if (!req.user) {
            throw new UnauthorizedError()
        }
        const user = await this.service.getMe(req.user.id)

        res.status(200).json({
            success: true,
            user,
        })
    }
}

function verificationPage(message: string | null, token: string | null) {
    const form = token
        ? `<form method="post" action="/api/v1/auth/verify-email"><input type="hidden" name="token" value="${token}"><button type="submit">Verify my email</button></form>`
        : ''
    const content =
        message ?? 'Confirm that you want to verify this email address.'
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email verification</title><style>body{font:16px system-ui,sans-serif;max-width:36rem;margin:12vh auto;padding:0 1.25rem;color:#18212f}button{font:inherit;padding:.7rem 1rem;background:#155eef;color:white;border:0;border-radius:.4rem;cursor:pointer}</style></head><body><main><h1>Email verification</h1><p>${content}</p>${form}</main></body></html>`
}
