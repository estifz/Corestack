import { db } from '../../prisma/db.js'
import type { AuthRepository } from './auth.repository.js'
import type { AuthUser, CreateUserRecord } from './auth.types.js'

export class PrismaAuthRepository implements AuthRepository {
    async findUserByEmail(email: string): Promise<AuthUser | null> {
        return db.orm.auth.User.select('id', 'email', 'role', 'isActive').first(
            {
                email,
            },
        )
    }

    async createUser(input: CreateUserRecord): Promise<AuthUser> {
        const user = await db.orm.auth.User.create({
            email: input.email,
            passwordHash: input.passwordHash,
        })

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        }
    }
}
