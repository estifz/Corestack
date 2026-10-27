import express from 'express'
import { health, readiness } from './health.controller.js'

const router = express.Router()

router.get('/', (_req, res) => {
    res.json({ status: 'Online', version: '1.0.0' })
})

router.get('/health', health)
router.get('/ready', readiness)

export default router
