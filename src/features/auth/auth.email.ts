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
