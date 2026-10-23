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

export const verifyEmailSchema = z.object({
    token: z.string().regex(/^[A-Za-z0-9_-]{40,50}$/),
})

export const resendVerificationEmailSchema = z.object({
    email: z.email(),
})

export const forgotPasswordSchema = z.object({
    email: z.email(),
})

export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
    token: z.string().regex(/^[A-Za-z0-9_-]{40,50}$/, 'Invalid token format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>
