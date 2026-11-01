export const DEPENDENCY_MAP = {
    postgres: {
        dependencies: [
            '@prisma/adapter-pg',
            '@prisma/client',
            '@prisma/config',
            'pg',
            'prisma',
        ],
        devDependencies: ['@types/pg'],
        filesToDelete: [
            'src/mongo',
            'src/features/auth/mongo-auth.repository.ts',
            'src/features/users/mongo-user.repository.ts',
        ],
        scriptsToDelete: ['docker:db:mongo'],
    },
    mongodb: {
        dependencies: ['mongoose'],
        devDependencies: [],
        filesToDelete: [
            'prisma',
            'prisma.config.ts',
            'src/prisma',
            'src/features/auth/prisma-auth.repository.ts',
            'src/features/users/prisma-user.repository.ts',
        ],
        scriptsToDelete: [
            'db:generate',
            'migration:dev',
            'migration:deploy',
            'migration:status',
            'docker:db:postgres',
        ],
    },
    auth: {
        dependencies: ['argon2', 'jose', 'resend', 'temporal-polyfill'],
        filesToDelete: [
            'src/features/auth',
            'src/features/users',
            'src/middlewares/auth.middleware.ts',
            'src/middlewares/requireTrustedOrigin.ts',
            'src/utils/jwt.ts',
            'src/utils/token.ts',
            'test/features/auth.service.test.ts',
            'test/features/auth.validation.test.ts',
            'test/features/auth.tokens.test.ts',
            'test/features/password-reset.test.ts',
            'test/features/user.service.test.ts',
            'test/middlewares/auth.middleware.test.ts',
            'test/middlewares/trusted-origin.test.ts',
            'test/utils/jwt.test.ts',
        ],
    },
    docs: {
        dependencies: ['@scalar/express-api-reference'],
        filesToDelete: ['src/docs', 'test/docs.routes.test.ts'],
    },
    docker: {
        filesToDelete: [
            'Dockerfile',
            '.dockerignore',
            'docker-entrypoint.sh',
            'compose.yaml',
        ],
        scriptsToDelete: [
            'docker:db:postgres',
            'docker:db:mongo',
            'docker:db:all',
            'docker:up',
            'docker:down',
        ],
    },
} as const
