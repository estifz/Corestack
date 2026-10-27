import { NotFoundError } from '../../utils/errors/appError.js'
import type { UserRepository } from './user.repository.js'
import type { ListUsersResult, UserProfile } from './user.types.js'

export class UserService {
    constructor(private repo: UserRepository) {}

    async getUser(id: string): Promise<UserProfile> {
        const user = await this.repo.getUser(id)
        if (!user) {
            throw new NotFoundError('User not found')
        }
        return user
    }

    async listUsers(params: {
        limit: number
        offset: number
    }): Promise<ListUsersResult> {
        return this.repo.listUsers(params)
    }
}
