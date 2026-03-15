#!/bin/sh
set -e

if [ -n "$MIGRATE_ON_START" ]; then
  echo "Waiting for database to be ready..."
  until node scripts/wait-for-db.mjs 2>/dev/null; do
    echo "Database is unavailable - sleeping 2s"
    sleep 2
  done
  echo "Database is ready."
  npx prisma migrate deploy
  npm run db:seed
fi

exec "$@"