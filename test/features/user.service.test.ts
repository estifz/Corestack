import { describe, expect, it, vi } from 'vitest'
import { UserService } from '../../src/features/users/user.service.js'
import type { userRepository } from '../../src/features/users/user.repository.js'

describe('UserService', () => {
    it('delegates the requested user id to the repository', async () => {
        const repo: userRepository = {
            getUser: vi.fn().mockResolvedValue('user record'),
        }
        const service = new UserService(repo)

        await expect(service.getUser('user-123')).resolves.toBe('user record')
        expect(repo.getUser).toHaveBeenCalledWith('user-123')
    })

    it('propagates repository errors', async () => {
        const failure = new Error('database unavailable')
        const service = new UserService({
            getUser: vi.fn().mockRejectedValue(failure),
        })

        await expect(service.getUser('user-123')).rejects.toBe(failure)
    })
})
