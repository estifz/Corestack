import argon2 from 'argon2'
import { ConflictError } from '../../utils/errors/appError.js'
import type { AuthRepository } from './auth.repository.js'
import type { AuthUser, RegisterUserInput } from './auth.types.js'

export class AuthService {
    constructor(private readonly repository: AuthRepository) {}

    async register(input: RegisterUserInput): Promise<AuthUser> {
        const existingUser = await this.repository.findUserByEmail(input.email)
        if (existingUser) {
            throw new ConflictError('A user with this email already exists')
        }

        const passwordHash = await argon2.hash(input.password)
        return this.repository.createUser({
            email: input.email,
            passwordHash,
        })
    }
}
