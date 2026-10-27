import { AuthController } from './auth.controller.js'
import { PrismaAuthRepository } from './prisma-auth.repository.js'
import { MongoAuthRepository } from './mongo-auth.repository.js'
import { AuthService } from './auth.service.js'
import { ENV } from '../../config/env.js'
import type { AuthRepository } from './auth.repository.js'

const repository: AuthRepository =
    ENV.DATABASE_PROVIDER === 'mongodb'
        ? new MongoAuthRepository()
        : new PrismaAuthRepository()

const service = new AuthService(repository)

export const authController = new AuthController(service)
