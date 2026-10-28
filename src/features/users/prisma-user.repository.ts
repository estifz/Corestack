import { prisma } from '../../prisma/db.js'
import type { UserRepository } from './user.repository.js'
import type {
    ListUsersQueryInput,
    ListUsersResult,
    UserProfile,
} from './user.types.js'

export class PrismaUserRepository implements UserRepository {
    async getUser(id: string): Promise<UserProfile | null> {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                emailVerifiedAt: true,
                createdAt: true,
            },
        })
        if (!user) return null

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            emailVerifiedAt: user.emailVerifiedAt,
            createdAt: user.createdAt,
        }
    }

    async listUsers(params: ListUsersQueryInput): Promise<ListUsersResult> {
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                    emailVerifiedAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: params.limit,
                skip: params.offset,
            }),
            prisma.user.count(),
        ])

        return {
            users,
            total,
        }
    }
}
