import mongoose, {
    type Document,
    type Model,
    Schema,
    type Types,
} from 'mongoose'

export interface IRefreshTokenDocument extends Document {
    sessionId: Types.ObjectId
    tokenHash: string
    expiresAt: Date
    consumedAt: Date | null
    revokedAt: Date | null
    createdAt: Date
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
    {
        sessionId: {
            type: Schema.Types.ObjectId,
            ref: 'Session',
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
        revokedAt: {
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

refreshTokenSchema.index({ sessionId: 1, expiresAt: 1 })

export const RefreshTokenModel: Model<IRefreshTokenDocument> =
    (mongoose.models.RefreshToken as Model<IRefreshTokenDocument>) ||
    mongoose.model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema)
