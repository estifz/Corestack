export const openapiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'CoreStack API',
        version: '1.0.0',
        description:
            'A production-oriented TypeScript backend foundation built for maintainability, consistency, and long-term reuse.',
    },
    servers: [
        {
            url: '/',
            description: 'Current Environment Server',
        },
    ],
    tags: [
        {
            name: 'System',
            description: 'Health, liveness, and database readiness checks',
        },
        {
            name: 'Auth',
            description:
                'Registration, authentication, token rotation, sessions, and password recovery',
        },
        {
            name: 'Users',
            description: 'User management (Admin restricted)',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description:
                    'JWT access token issued upon successful login or token refresh. Sent in Authorization header: Bearer <token>',
            },
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'refresh_token',
                description:
                    'HTTP-only refresh cookie used for rotating sessions and logging out.',
            },
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    code: {
                        type: 'string',
                        example: 'VALIDATION_ERROR',
                        enum: [
                            'NOT_FOUND',
                            'VALIDATION_ERROR',
                            'UNAUTHORIZED',
                            'FORBIDDEN',
                            'RESOURCE_ALREADY_EXISTS',
                            'BAD_REQUEST',
                            'RATE_LIMIT_EXCEEDED',
                            'INTERNAL_SERVER_ERROR',
                        ],
                    },
                    message: {
                        type: 'string',
                        example: 'Invalid request data',
                    },
                    details: {
                        type: 'array',
                        items: { type: 'object' },
                        description: 'Detailed validation issues, if any',
                    },
                },
                required: ['success', 'code', 'message'],
            },
            User: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        example: 'developer@example.com',
                    },
                    role: {
                        type: 'string',
                        enum: ['USER', 'ADMIN'],
                        example: 'USER',
                    },
                    emailVerifiedAt: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true,
                        example: '2026-10-23T12:00:00.000Z',
                    },
                    isActive: {
                        type: 'boolean',
                        example: true,
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-10-23T12:00:00.000Z',
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2026-10-23T12:00:00.000Z',
                    },
                },
                required: [
                    'id',
                    'email',
                    'role',
                    'emailVerifiedAt',
                    'isActive',
                    'createdAt',
                    'updatedAt',
                ],
            },
            Pagination: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 42 },
                    limit: { type: 'integer', example: 20 },
                    offset: { type: 'integer', example: 0 },
                },
                required: ['total', 'limit', 'offset'],
            },
        },
    },
    paths: {
        '/health': {
            get: {
                tags: ['System'],
                summary: 'Process liveness check',
                description:
                    'Checks if the HTTP server process is running and accepting traffic without probing the database.',
                responses: {
                    200: {
                        description: 'Process is alive',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            example: 'ok',
                                        },
                                    },
                                    required: ['status'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/ready': {
            get: {
                tags: ['System'],
                summary: 'PostgreSQL database readiness check',
                description:
                    'Executes a lightweight query against PostgreSQL to ensure the persistence layer is healthy.',
                responses: {
                    200: {
                        description: 'PostgreSQL is connected and ready',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            example: 'ready',
                                        },
                                        timestamp: {
                                            type: 'string',
                                            format: 'date-time',
                                            example: '2026-10-23T12:00:00.000Z',
                                        },
                                    },
                                    required: ['status', 'timestamp'],
                                },
                            },
                        },
                    },
                    503: {
                        description: 'PostgreSQL is unavailable',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            example: 'not_ready',
                                        },
                                        error: {
                                            type: 'string',
                                            example:
                                                'Database connection failed',
                                        },
                                    },
                                    required: ['status', 'error'],
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new user account',
                description:
                    'Creates an unverified account and triggers an email verification token.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: {
                                        type: 'string',
                                        format: 'email',
                                        example: 'developer@example.com',
                                    },
                                    password: {
                                        type: 'string',
                                        format: 'password',
                                        minLength: 8,
                                        example: 'P@ssw0rd12345!',
                                    },
                                },
                                required: ['email', 'password'],
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'User registered successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        user: {
                                            $ref: '#/components/schemas/User',
                                        },
                                    },
                                    required: ['success', 'user'],
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Validation error (malformed payload)',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                    409: {
                        description: 'Email already registered',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/verify-email': {
            get: {
                tags: ['Auth'],
                summary: 'Render email verification landing page',
                description:
                    'Displays the confirmation page with a submit button. Protected against email link crawlers by not mutating state on GET.',
                parameters: [
                    {
                        name: 'token',
                        in: 'query',
                        required: true,
                        description: 'Email verification token from link',
                        schema: {
                            type: 'string',
                            example: 'f87d6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'HTML confirmation page',
                        content: {
                            'text/html': {
                                schema: { type: 'string' },
                            },
                        },
                    },
                    400: {
                        description: 'Invalid token format',
                        content: {
                            'text/html': {
                                schema: { type: 'string' },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Auth'],
                summary: 'Confirm email verification',
                description:
                    'Consumes the verification token and activates email verification for the user.',
                requestBody: {
                    required: true,
                    content: {
                        'application/x-www-form-urlencoded': {
                            schema: {
                                type: 'object',
                                properties: {
                                    token: { type: 'string' },
                                },
                                required: ['token'],
                            },
                        },
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    token: { type: 'string' },
                                },
                                required: ['token'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'HTML confirmation response',
                        content: {
                            'text/html': {
                                schema: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/resend-verification': {
            post: {
                tags: ['Auth'],
                summary: 'Resend email verification link',
                description:
                    'Sends a new verification link if the account exists and is unverified. Always returns 202.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: {
                                        type: 'string',
                                        format: 'email',
                                        example: 'developer@example.com',
                                    },
                                },
                                required: ['email'],
                            },
                        },
                    },
                },
                responses: {
                    202: {
                        description: 'Verification request accepted',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        message: {
                                            type: 'string',
                                            example:
                                                'If the account needs verification, a link will be sent shortly.',
                                        },
                                    },
                                    required: ['success', 'message'],
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Validation error',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Authenticate and start a session',
                description:
                    'Validates credentials, creates a session, returns a JWT access token, and sets an HTTP-only refresh token cookie.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: {
                                        type: 'string',
                                        format: 'email',
                                        example: 'developer@example.com',
                                    },
                                    password: {
                                        type: 'string',
                                        format: 'password',
                                        example: 'P@ssw0rd12345!',
                                    },
                                },
                                required: ['email', 'password'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Authentication successful',
                        headers: {
                            'Set-Cookie': {
                                schema: {
                                    type: 'string',
                                    example:
                                        'refresh_token=...; Path=/; HttpOnly; SameSite=Lax',
                                },
                                description:
                                    'HTTP-only cookie containing the rotating refresh token',
                            },
                        },
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        accessToken: {
                                            type: 'string',
                                            example:
                                                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                        },
                                    },
                                    required: ['success', 'accessToken'],
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Validation error',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Invalid credentials',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                    403: {
                        description:
                            'Account is inactive or email is not verified',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Rotate refresh token and issue new access token',
                description:
                    'Consumes the current refresh cookie and issues a new access token + new refresh cookie. Requires trusted Origin header.',
                parameters: [
                    {
                        name: 'Origin',
                        in: 'header',
                        required: true,
                        schema: {
                            type: 'string',
                            example: 'http://localhost:3000',
                        },
                        description:
                            'Must match an origin specified in CORS_ORIGINS.',
                    },
                ],
                security: [{ cookieAuth: [] }],
                responses: {
                    200: {
                        description: 'Tokens refreshed successfully',
                        headers: {
                            'Set-Cookie': {
                                schema: {
                                    type: 'string',
                                    example:
                                        'refresh_token=...; Path=/; HttpOnly; SameSite=Lax',
                                },
                                description: 'New rotated refresh token cookie',
                            },
                        },
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        accessToken: {
                                            type: 'string',
                                            example:
                                                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                        },
                                    },
                                    required: ['success', 'accessToken'],
                                },
                            },
                        },
                    },
                    401: {
                        description:
                            'Missing, invalid, or expired refresh token',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                    403: {
                        description: 'Untrusted request origin',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Revoke active session and logout',
                description:
                    'Revokes the current session and clears the refresh cookie. Requires trusted Origin header.',
                parameters: [
                    {
                        name: 'Origin',
                        in: 'header',
                        required: true,
                        schema: {
                            type: 'string',
                            example: 'http://localhost:3000',
                        },
                    },
                ],
                security: [{ cookieAuth: [] }],
                responses: {
                    200: {
                        description: 'Logged out successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                    },
                                    required: ['success'],
                                },
                            },
                        },
                    },
                    403: {
                        description: 'Untrusted request origin',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Request password reset email',
                description:
                    'Issues a password reset token and sends an email if the account exists and is active.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: {
                                        type: 'string',
                                        format: 'email',
                                        example: 'developer@example.com',
                                    },
                                },
                                required: ['email'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Reset request received',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        message: {
                                            type: 'string',
                                            example:
                                                'If an account with that email exists, a password reset link has been sent.',
                                        },
                                    },
                                    required: ['success', 'message'],
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Validation error',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/reset-password': {
            post: {
                tags: ['Auth'],
                summary: 'Reset password with token',
                description:
                    'Updates the user password and revokes all active sessions for the user.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    token: {
                                        type: 'string',
                                        example:
                                            'a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e',
                                    },
                                    password: {
                                        type: 'string',
                                        format: 'password',
                                        minLength: 8,
                                        example: 'NewSuperPassword1234!',
                                    },
                                },
                                required: ['token', 'password'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Password reset successful',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        message: {
                                            type: 'string',
                                            example:
                                                'Password has been reset successfully.',
                                        },
                                    },
                                    required: ['success', 'message'],
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            'Invalid or expired token, or payload validation failure',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get current user profile',
                description:
                    'Returns profile information for the authenticated user.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Current user profile retrieved',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        user: {
                                            $ref: '#/components/schemas/User',
                                        },
                                    },
                                    required: ['success', 'user'],
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Missing or invalid access token',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/users': {
            get: {
                tags: ['Users'],
                summary: 'List users (Admin only)',
                description:
                    'Returns a paginated list of all users. Requires an access token with ADMIN role.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'limit',
                        in: 'query',
                        required: false,
                        description: 'Number of records to return (1-100)',
                        schema: {
                            type: 'integer',
                            default: 20,
                            minimum: 1,
                            maximum: 100,
                        },
                    },
                    {
                        name: 'offset',
                        in: 'query',
                        required: false,
                        description: 'Number of records to skip',
                        schema: {
                            type: 'integer',
                            default: 0,
                            minimum: 0,
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'List of users',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
                                                $ref: '#/components/schemas/User',
                                            },
                                        },
                                        pagination: {
                                            $ref: '#/components/schemas/Pagination',
                                        },
                                    },
                                    required: ['success', 'data', 'pagination'],
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Authentication required',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                    403: {
                        description: 'Forbidden: Requires ADMIN role',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/v1/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Get user by ID (Admin only)',
                description:
                    'Retrieves full profile for a specific user ID. Requires ADMIN role.',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'Target user UUID',
                        schema: {
                            type: 'string',
                            format: 'uuid',
                            example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'User details',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        user: {
                                            $ref: '#/components/schemas/User',
                                        },
                                    },
                                    required: ['success', 'user'],
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Authentication required',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                    403: {
                        description: 'Forbidden: Requires ADMIN role',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                    404: {
                        description: 'User not found',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} as const
