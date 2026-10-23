import type { Request, Response } from 'express'
import type { UserService } from './user.service.js'
import { getUserParamsSchema, listUsersQuerySchema } from './user.validation.js'

export class UserController {
    constructor(private service: UserService) {}

    async getUser(req: Request, res: Response) {
        const { id } = getUserParamsSchema.parse(req.params)
        const user = await this.service.getUser(id)

        res.status(200).json({
            success: true,
            user,
        })
    }

    async listUsers(req: Request, res: Response) {
        const query = listUsersQuerySchema.parse(req.query)
        const result = await this.service.listUsers(query)

        res.status(200).json({
            success: true,
            data: result.users,
            pagination: {
                total: result.total,
                limit: query.limit,
                offset: query.offset,
            },
        })
    }
}
