import type { ProjectConfig } from '../types.js'
import { transformDatabase } from './database.js'
import { transformAuth } from './auth.js'
import { transformDocs } from './docs.js'
import { transformDocker } from './docker.js'
import { transformEnv } from './env.js'
import { transformPackageJson } from './package-json.js'
import { transformReadme } from './readme.js'

export function applyTransforms(config: ProjectConfig): void {
    // 1. Prune & isolate database provider (Postgres vs Mongo)
    transformDatabase(config)

    // 2. Prune Auth & RBAC if disabled
    transformAuth(config)

    // 3. Prune Docs & Scalar if disabled
    transformDocs(config)

    // 4. Prune Docker & Compose if disabled or tailor services
    transformDocker(config)

    // 5. Tailor environment variables (.env.example, .env, env.ts, test/setup.ts)
    transformEnv(config)

    // 6. Tailor package.json dependencies and scripts
    transformPackageJson(config)

    // 7. Generate tailored child README.md
    transformReadme(config)
}
