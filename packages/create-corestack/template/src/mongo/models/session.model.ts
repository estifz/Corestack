import mongoose, {
    type Document,
    type Model,
    Schema,
    type Types,
} from 'mongoose'

export interface ISessionDocument extends Document {
    userId: Types.ObjectId
    deviceName: string | null
    ipAddress: string | null
    userAgent: string | null
    lastSeenAt: Date | null
    expiresAt: Date
    revokedAt: Date | null
    createdAt: Date
}

const sessionSchema = new Schema<ISessionDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        deviceName: {
            type: String,
            default: null,
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
        lastSeenAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
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

sessionSchema.index({ userId: 1, expiresAt: 1 })

export const SessionModel: Model<ISessionDocument> =
    (mongoose.models.Session as Model<ISessionDocument>) ||
    mongoose.model<ISessionDocument>('Session', sessionSchema)
