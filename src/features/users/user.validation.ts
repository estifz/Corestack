import { z } from 'zod'

export const getUserParamsSchema = z.object({
    id: z.string().trim().min(1, 'User ID is required'),
})

export type GetUserParams = z.infer<typeof getUserParamsSchema>

export const listUsersQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
})

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
