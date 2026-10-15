import { z } from 'zod'

export const registerUserSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
})

export type RegisterUserBody = z.infer<typeof registerUserSchema>

export const loginUserSchema = z.object({
    email: z.email(),
    password: z.string().min(1, 'Password is required'),
})

export type LoginUserBody = z.infer<typeof loginUserSchema>
