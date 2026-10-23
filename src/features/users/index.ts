import { UserController } from './user.controller.js'
import { PrismaUserRepository } from './prisma-user.repository.js'
import { UserService } from './user.service.js'

const repository = new PrismaUserRepository()

const service = new UserService(repository)

export const userController = new UserController(service)
