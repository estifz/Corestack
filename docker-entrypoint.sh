#!/bin/sh
set -e

if [ "$DATABASE_PROVIDER" = "postgres" ]; then
  echo "=> [Entrypoint] Running database migrations (prisma migrate deploy)..."
  npx prisma migrate deploy
  echo "=> [Entrypoint] Migrations completed successfully."
fi

exec "$@"

