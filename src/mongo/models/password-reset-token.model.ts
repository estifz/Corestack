import mongoose, {
    type Document,
    type Model,
    Schema,
    type Types,
} from 'mongoose'

export interface IPasswordResetTokenDocument extends Document {
    userId: Types.ObjectId
    tokenHash: string
    expiresAt: Date
    consumedAt: Date | null
    createdAt: Date
}

const passwordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        consumedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

passwordResetTokenSchema.index({ userId: 1, expiresAt: 1 })

export const PasswordResetTokenModel: Model<IPasswordResetTokenDocument> =
    (mongoose.models
        .PasswordResetToken as Model<IPasswordResetTokenDocument>) ||
    mongoose.model<IPasswordResetTokenDocument>(
        'PasswordResetToken',
        passwordResetTokenSchema,
    )
