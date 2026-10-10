import { definePrismaConfig } from '@prisma/cli-engine'
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config'
import { ENV } from './src/config/env'

export default definePrismaConfig({
    orm: ormConfig({
        contract: './src/prisma/contract.prisma',
        db: {
            connection: ENV.DATABASE_URL,
        },
    }),
})
