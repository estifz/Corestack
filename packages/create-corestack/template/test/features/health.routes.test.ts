import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import healthRoutes from '../../src/features/health/health.route.js'

describe('health routes', () => {
    it('reports the service as online', async () => {
        const response = await request(express().use(healthRoutes)).get('/')
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ status: 'Online', version: '1.0.0' })
    })

    it('reports application health', async () => {
        const response = await request(express().use(healthRoutes)).get(
            '/health',
        )
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ status: 'ok' })
    })
})
