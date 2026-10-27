import express from 'express'
import { authController } from './index.js'
import { authenticate } from '../../middlewares/auth.middleware.js'
import { requireTrustedOrigin } from '../../middlewares/requireTrustedOrigin.js'

const router = express.Router()

router.post('/register', authController.register.bind(authController))
router.get(
    '/verify-email',
    authController.showEmailVerification.bind(authController),
)
router.post('/verify-email', authController.verifyEmail.bind(authController))
router.post(
    '/resend-verification',
    authController.resendVerificationEmail.bind(authController),
)
router.post(
    '/forgot-password',
    authController.forgotPassword.bind(authController),
)
router.post(
    '/reset-password',
    authController.resetPassword.bind(authController),
)
router.post('/login', authController.login.bind(authController))
router.post(
    '/refresh',
    requireTrustedOrigin,
    authController.refresh.bind(authController),
)
router.post(
    '/logout',
    requireTrustedOrigin,
    authController.logout.bind(authController),
)
router.get('/me', authenticate, authController.me.bind(authController))

export default router
