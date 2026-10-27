import mongoose from 'mongoose'
import { UserModel } from '../../mongo/models/user.model.js'
import type { UserRepository } from './user.repository.js'
import type {
    ListUsersQueryInput,
    ListUsersResult,
    UserProfile,
} from './user.types.js'

export class MongoUserRepository implements UserRepository {
    async getUser(id: string): Promise<UserProfile | null> {
        if (!mongoose.isValidObjectId(id)) {
            return null
        }

        const user = await UserModel.findById(id).lean()
        if (!user) {
            return null
        }

        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            emailVerifiedAt: user.emailVerifiedAt,
            createdAt: user.createdAt,
        }
    }

    async listUsers(params: ListUsersQueryInput): Promise<ListUsersResult> {
        const [users, total] = await Promise.all([
            UserModel.find()
                .sort({ createdAt: -1 })
                .skip(params.offset)
                .limit(params.limit)
                .lean(),
            UserModel.countDocuments(),
        ])

        return {
            users: users.map((user) => ({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                emailVerifiedAt: user.emailVerifiedAt,
                createdAt: user.createdAt,
            })),
            total,
        }
    }
}
