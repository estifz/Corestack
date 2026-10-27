import { db } from '../../prisma/db.js'
import type { UserRepository } from './user.repository.js'
import type {
    ListUsersQueryInput,
    ListUsersResult,
    UserProfile,
} from './user.types.js'

export class PrismaUserRepository implements UserRepository {
    async getUser(id: string): Promise<UserProfile | null> {
        return db.orm.auth.User.select(
            'id',
            'email',
            'role',
            'isActive',
            'emailVerifiedAt',
            'createdAt',
        ).first({ id })
    }

    async listUsers(params: ListUsersQueryInput): Promise<ListUsersResult> {
        const [users, aggregateResult] = await Promise.all([
            db.orm.auth.User.select(
                'id',
                'email',
                'role',
                'isActive',
                'emailVerifiedAt',
                'createdAt',
            )
                .orderBy((u) => u.createdAt.desc())
                .limit(params.limit)
                .offset(params.offset)
                .all(),
            db.orm.auth.User.aggregate((a) => ({
                total: a.count(),
            })),
        ])

        return {
            users,
            total: aggregateResult.total,
        }
    }
}
