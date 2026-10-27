import { UserController } from './user.controller.js'
import { PrismaUserRepository } from './prisma-user.repository.js'
import { MongoUserRepository } from './mongo-user.repository.js'
import { UserService } from './user.service.js'
import { ENV } from '../../config/env.js'
import type { UserRepository } from './user.repository.js'

const repository: UserRepository =
    ENV.DATABASE_PROVIDER === 'mongodb'
        ? new MongoUserRepository()
        : new PrismaUserRepository()

const service = new UserService(repository)

export const userController = new UserController(service)
