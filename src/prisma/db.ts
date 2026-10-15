import 'temporal-polyfill/full/global'
import postgres from '@prisma/orm-postgres/runtime'
import type { Contract } from './contract.d'
import contractJson from './contract.json' with { type: 'json' }
import { ENV } from '../config/env.js'

export const db = postgres<Contract>({
    contractJson,
    url: ENV.DATABASE_URL,
})
