import mongoose from 'mongoose'
import { ENV } from '../config/env.js'
import { logger } from '../core/logger/logger.js'

let isConnected = false

export const mongoDb = {
    async connect(): Promise<typeof mongoose> {
        if (isConnected && mongoose.connection.readyState === 1) {
            return mongoose
        }

        try {
            await mongoose.connect(ENV.MONGODB_URI)
            isConnected = true
            logger.info('MongoDB connected successfully')
            return mongoose
        } catch (error) {
            logger.error({ err: error }, 'Failed to connect to MongoDB')
            throw error
        }
    },

    async close(): Promise<void> {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect()
            isConnected = false
            logger.info('MongoDB connection closed')
        }
    },

    async ping(): Promise<boolean> {
        try {
            if (mongoose.connection.readyState !== 1) {
                return false
            }
            if (!mongoose.connection.db) {
                return false
            }
            await mongoose.connection.db.admin().ping()
            return true
        } catch {
            return false
        }
    },

    get connection() {
        return mongoose.connection
    },
}
