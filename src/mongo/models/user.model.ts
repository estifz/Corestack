import mongoose, { type Document, type Model, Schema } from 'mongoose'
import type { UserRole } from '../../utils/jwt.js'

export interface IUserDocument extends Document {
    email: string
    passwordHash: string
    role: UserRole
    emailVerifiedAt: Date | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const userSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['USER', 'ADMIN'],
            default: 'USER',
            required: true,
        },
        emailVerifiedAt: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

export const UserModel: Model<IUserDocument> =
    (mongoose.models.User as Model<IUserDocument>) ||
    mongoose.model<IUserDocument>('User', userSchema)
