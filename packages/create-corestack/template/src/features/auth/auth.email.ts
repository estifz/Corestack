import { Resend } from 'resend'
import { ENV } from '../../config/env.js'

export async function sendVerificationEmail(to: string, token: string) {
    if (!ENV.RESEND_API_KEY) {
        throw new Error(
            'RESEND_API_KEY is required to send verification emails',
        )
    }
    const resend = new Resend(ENV.RESEND_API_KEY)
    const verificationUrl = new URL(
        '/api/v1/auth/verify-email',
        ENV.API_BASE_URL,
    )
    verificationUrl.searchParams.set('token', token)

    const { error } = await resend.emails.send({
        from: ENV.RESEND_FROM_EMAIL,
        to,
        subject: 'Verify your email address',
        html: `<p>Confirm your email address by opening the link below, then selecting “Verify my email”.</p><p><a href="${verificationUrl.toString()}">Confirm email address</a></p>`,
        text: `Confirm your email address by opening this link, then selecting “Verify my email”: ${verificationUrl.toString()}`,
    })

    if (error)
        throw new Error(
            `Resend failed to send verification email: ${error.message}`,
        )
}

export async function sendPasswordResetEmail(to: string, token: string) {
    if (!ENV.RESEND_API_KEY) {
        throw new Error(
            'RESEND_API_KEY is required to send password reset emails',
        )
    }
    const resend = new Resend(ENV.RESEND_API_KEY)
    const resetUrl = new URL('/api/v1/auth/reset-password', ENV.API_BASE_URL)
    resetUrl.searchParams.set('token', token)

    const { error } = await resend.emails.send({
        from: ENV.RESEND_FROM_EMAIL,
        to,
        subject: 'Reset your password',
        html: `<p>We received a request to reset your password. Use the link below to set a new password:</p><p><a href="${resetUrl.toString()}">Reset password</a></p><p>If you did not request a password reset, you can safely ignore this email.</p>`,
        text: `We received a request to reset your password. Use this link to set a new password: ${resetUrl.toString()}\n\nIf you did not request a password reset, you can safely ignore this email.`,
    })

    if (error)
        throw new Error(
            `Resend failed to send password reset email: ${error.message}`,
        )
}
