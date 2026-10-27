import { describe, expect, it, vi } from 'vitest'
import { UserService } from '../../src/features/users/user.service.js'
import type { UserRepository } from '../../src/features/users/user.repository.js'
import { NotFoundError } from '../../src/utils/errors/appError.js'

describe('UserService', () => {
    it('delegates the requested user id to the repository and returns the user', async () => {
        const mockUser = {
            id: 'user-123',
            email: 'user@example.com',
            role: 'USER' as const,
            isActive: true,
        }
        const repo: UserRepository = {
            getUser: vi.fn().mockResolvedValue(mockUser),
            listUsers: vi.fn(),
        }
        const service = new UserService(repo)

        await expect(service.getUser('user-123')).resolves.toEqual(mockUser)
        expect(repo.getUser).toHaveBeenCalledWith('user-123')
    })

    it('throws NotFoundError when user does not exist', async () => {
        const repo: UserRepository = {
            getUser: vi.fn().mockResolvedValue(null),
            listUsers: vi.fn(),
        }
        const service = new UserService(repo)

        await expect(service.getUser('user-123')).rejects.toBeInstanceOf(
            NotFoundError,
        )
    })

    it('propagates repository errors', async () => {
        const failure = new Error('database unavailable')
        const service = new UserService({
            getUser: vi.fn().mockRejectedValue(failure),
            listUsers: vi.fn(),
        })

        await expect(service.getUser('user-123')).rejects.toBe(failure)
    })

    it('delegates listing users with pagination to the repository', async () => {
        const mockResult = {
            users: [
                {
                    id: 'user-1',
                    email: 'admin@example.com',
                    role: 'ADMIN' as const,
                    isActive: true,
                },
            ],
            total: 1,
        }
        const repo: UserRepository = {
            getUser: vi.fn(),
            listUsers: vi.fn().mockResolvedValue(mockResult),
        }
        const service = new UserService(repo)

        const result = await service.listUsers({ limit: 10, offset: 0 })
        expect(result).toEqual(mockResult)
        expect(repo.listUsers).toHaveBeenCalledWith({ limit: 10, offset: 0 })
    })
})
