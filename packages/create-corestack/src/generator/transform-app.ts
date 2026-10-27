import path from 'node:path'
import fs from 'fs-extra'

export async function transformApp(
    targetDir: string,
    options: { auth: boolean; docs: boolean },
): Promise<void> {
    const { auth, docs } = options
    const appPath = path.join(targetDir, 'src/app.ts')

    const imports: string[] = [
        "import express from 'express'",
        "import morgan from 'morgan'",
    ]

    if (auth) {
        imports.push("import userRoutes from './features/users/user.route.js'")
        imports.push("import authRoutes from './features/auth/auth.route.js'")
    }

    imports.push("import healthRoutes from './features/health/health.route.js'")

    if (docs) {
        imports.push("import docsRoutes from './docs/docs.route.js'")
    }

    imports.push("import { errorHandler } from './middlewares/errorHandler.js'")
    imports.push("import { limiter } from './middlewares/rateLimiter.js'")
    imports.push("import helmet from 'helmet'")
    imports.push("import compression from 'compression'")
    imports.push("import cors from 'cors'")
    imports.push("import { ENV } from './config/env.js'")
    imports.push("import { NotFoundError } from './utils/errors/appError.js'")

    const morganConfig = auth
        ? `app.use(
    morgan('dev', {
        skip: (req) =>
            req.method === 'GET' && req.path === '/api/v1/auth/verify-email',
    }),
)`
        : `app.use(morgan('dev'))`

    const routeMounts: string[] = ['app.use(healthRoutes)']
    if (docs) {
        routeMounts.push('app.use(docsRoutes)')
    }
    if (auth) {
        routeMounts.push("app.use('/api/v1/auth', authRoutes)")
        routeMounts.push("app.use('/api/v1/users', userRoutes)")
    }

    const appContent = `${imports.join('\n')}

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
${morganConfig}
app.use(limiter)

${routeMounts.join('\n')}

app.use((_req, _res, next) => {
    next(new NotFoundError('Route not found'))
})

app.use(errorHandler)

export default app
`

    await fs.writeFile(appPath, appContent, 'utf-8')
}
