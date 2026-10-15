import argon2 from 'argon2'
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from '../../utils/errors/appError.js'
import { signAccessToken } from '../../utils/jwt.js'
import type { AuthRepository } from './auth.repository.js'
import type {
    AuthUser,
    LoginResult,
    LoginUserInput,
    RegisterUserInput,
} from './auth.types.js'

export class AuthService {
    constructor(private readonly repository: AuthRepository) {}

    async register(input: RegisterUserInput): Promise<AuthUser> {
        const normalizedEmail = input.email.trim().toLowerCase()
        const existingUser =
            await this.repository.findUserByEmail(normalizedEmail)
        if (existingUser) {
            throw new ConflictError('A user with this email already exists')
        }

        const passwordHash = await argon2.hash(input.password)
        return this.repository.createUser({
            email: normalizedEmail,
            passwordHash,
        })
    }

    async login(input: LoginUserInput): Promise<LoginResult> {
        const normalizedEmail = input.email.trim().toLowerCase()
        const user = await this.repository.findUserByEmail(normalizedEmail)

        if (!user) {
            throw new UnauthorizedError('Invalid credentials')
        }

        const isPasswordValid = await argon2.verify(
            user.passwordHash,
            input.password,
        )
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials')
        }

        if (!user.isActive) {
            throw new ForbiddenError('Account is inactive')
        }

        if (!user.emailVerifiedAt) {
            throw new ForbiddenError('Account is not verified')
        }

        const accessToken = await signAccessToken({
            userId: user.id,
            role: user.role,
        })

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            },
            accessToken,
        }
    }

    async getMe(userId: string): Promise<AuthUser> {
        const user = await this.repository.findUserById(userId)
        if (!user) {
            throw new NotFoundError('User not found')
        }
        return user
    }
}
