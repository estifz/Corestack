#!/bin/sh
set -e

# In the Parent foundation, run Prisma migrations only if PostgreSQL is the active provider
if [ "$DATABASE_PROVIDER" = "postgres" ]; then
  echo "=> [Entrypoint] Running database migrations (prisma migrate deploy)..."
  npx prisma migrate deploy
  echo "=> [Entrypoint] Migrations completed successfully."
fi

exec "$@"

