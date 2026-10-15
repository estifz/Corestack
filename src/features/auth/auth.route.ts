import express from 'express'
import { authController } from './index.js'

const router = express.Router()

router.post('/register', authController.register.bind(authController))
router.post('/login', authController.login.bind(authController))

export default router
