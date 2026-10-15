import express from 'express'
import { authController } from './index.js'

const router = express.Router()

router.post('/register', authController.register.bind(authController))

export default router
