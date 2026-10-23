import type {
    ListUsersQueryInput,
    ListUsersResult,
    UserProfile,
} from './user.types.js'

export interface UserRepository {
    getUser(id: string): Promise<UserProfile | null>
    listUsers(params: ListUsersQueryInput): Promise<ListUsersResult>
}
