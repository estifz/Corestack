import { AuthController } from './auth.controller.js'
import { PrismaAuthRepository } from './prisma-auth.repository.js'
import { AuthService } from './auth.service.js'

const repository = new PrismaAuthRepository()
const service = new AuthService(repository)

export const authController = new AuthController(service)
