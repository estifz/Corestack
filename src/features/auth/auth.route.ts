import express from 'express'
import { authController } from './index.js'
import { authenticate } from '../../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/register', authController.register.bind(authController))
router.post('/login', authController.login.bind(authController))
router.get('/me', authenticate, authController.me.bind(authController))

export default router
