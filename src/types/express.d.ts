import type { UserRole } from '../utils/jwt.js'

export interface AuthenticatedUser {
    id: string
    role: UserRole
    isEmailVerified: boolean
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser
        }
    }
}
