import { db } from '../../prisma/db.js'
import type { AuthRepository } from './auth.repository.js'
import type { AuthUser, CreateUserRecord, UserRecord } from './auth.types.js'

export class PrismaAuthRepository implements AuthRepository {
    async findUserByEmail(email: string): Promise<UserRecord | null> {
        return db.orm.auth.User.select(
            'id',
            'email',
            'role',
            'isActive',
            'passwordHash',
            'emailVerifiedAt',
        ).first({
            email,
        })
    }

    async findUserById(id: string): Promise<AuthUser | null> {
        return db.orm.auth.User.select('id', 'email', 'role', 'isActive').first(
            {
                id,
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
