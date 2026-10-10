import type { userRepository } from './user.repository.js'

export class UserService {
    constructor(private repo: userRepository) {}

    async getUser(id: string) {
        const response = await this.repo.getUser(id)
        return response
    }
}
