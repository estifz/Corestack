import express from 'express'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import healthRoutes from '../../src/features/health/health.route.js'
import { db } from '../../src/prisma/db.js'

describe.skipIf(!process.env.TEST_DATABASE_URL)(
    'PostgreSQL readiness integration',
    () => {
        afterAll(async () => {
            await db.close()
        })

        it('executes the readiness query against the configured test database', async () => {
            const response = await request(express().use(healthRoutes)).get(
                '/ready',
            )

            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                status: 'ok',
                database: 'connected',
            })
        })
    },
)
