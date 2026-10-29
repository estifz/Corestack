/// <reference types="node" />

process.env.NODE_ENV ??= 'test'
process.env.PORT ??= '3000'
process.env.API_BASE_URL ??= 'http://localhost:3000'
process.env.LOG_LEVEL ??= 'silent'
process.env.RATE_LIMIT_WINDOW ??= '60000'
process.env.RATE_LIMIT_REQUEST ??= '1000'
process.env.DATABASE_PROVIDER ??= 'postgres'
process.env.DATABASE_URL ??=
    'postgresql://test:test@localhost:5432/corestack_test'
process.env.JWT_SECRET ??= 'test-secret-that-is-long-enough-for-hmac'
process.env.JWT_EXPIRES_IN ??= '15m'
process.env.RESEND_API_KEY ??= 're_test_key'
process.env.PASSWORD_RESET_TTL_SECONDS ??= '900'
process.env.CORS_ORIGINS ??= 'http://localhost:3000'
