import express from 'express'
import morgan from 'morgan'
import userRoutes from './features/users/user.route.js'
import authRoutes from './features/auth/auth.route.js'
import healthRoutes from './features/health/health.route.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { limiter } from './middlewares/rateLimiter.js'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import { ENV } from './config/env.js'
import { NotFoundError } from './utils/errors/appError.js'

const app = express()

app.use(
    cors({
        origin: ENV.CORS_ORIGINS,
        credentials: true,
    }),
)
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
    morgan('dev', {
        skip: (req) =>
            req.method === 'GET' && req.path === '/api/v1/auth/verify-email',
    }),
)
app.use(limiter)

app.use(healthRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)

app.use((_req, _res, next) => {
    next(new NotFoundError('Route not found'))
})

app.use(errorHandler)

export default app
