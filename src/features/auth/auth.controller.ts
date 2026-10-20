import type { Request, Response } from 'express'
import { UnauthorizedError } from '../../utils/errors/appError.js'
import type { AuthService } from './auth.service.js'
import { loginUserSchema, registerUserSchema } from './auth.validation.js'
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
            user,
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
