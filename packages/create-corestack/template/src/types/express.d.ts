import type { UserRole } from '../utils/jwt.js'

export interface AuthenticatedUser {
    id: string
    role: UserRole
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser
        }
    }
}
