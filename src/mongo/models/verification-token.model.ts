import mongoose, {
    type Document,
    type Model,
    Schema,
    type Types,
} from 'mongoose'

export interface IEmailVerificationTokenDocument extends Document {
    userId: Types.ObjectId
    tokenHash: string
    expiresAt: Date
    consumedAt: Date | null
    createdAt: Date
}

const emailVerificationTokenSchema =
    new Schema<IEmailVerificationTokenDocument>(
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

emailVerificationTokenSchema.index({ userId: 1, expiresAt: 1 })

export const EmailVerificationTokenModel: Model<IEmailVerificationTokenDocument> =
    (mongoose.models
        .EmailVerificationToken as Model<IEmailVerificationTokenDocument>) ||
    mongoose.model<IEmailVerificationTokenDocument>(
        'EmailVerificationToken',
        emailVerificationTokenSchema,
    )
