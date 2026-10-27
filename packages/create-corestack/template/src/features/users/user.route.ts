import express from 'express'
import { userController } from './index.js'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'

const router = express.Router()

router.get(
    '/',
    authenticate,
    authorize('ADMIN'),
    userController.listUsers.bind(userController),
)

router.get(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    userController.getUser.bind(userController),
)

export default router
