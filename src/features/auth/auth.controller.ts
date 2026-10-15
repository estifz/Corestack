import type { Request, Response } from 'express'
import type { AuthService } from './auth.service.js'
import { loginUserSchema, registerUserSchema } from './auth.validation.js'

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
        const user = await this.service.login(input)

        res.status(200).json({
            success: true,
            user,
        })
    }
}
