#!/bin/sh
set -e

case "${MIGRATE_ON_START:-false}" in
  true|TRUE|1|yes|YES)
    RUN_MIGRATIONS=true
    ;;
  *)
    RUN_MIGRATIONS=false
    ;;
esac

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Waiting for database to be ready..."
  until node scripts/wait-for-db.mjs 2>/dev/null; do
    echo "Database is unavailable - sleeping 2s"
    sleep 2
  done
  echo "Database is ready."
  if [ -x "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma migrate deploy
  else
    echo "MIGRATE_ON_START is true but Prisma CLI is not available in this runtime image." >&2
    echo "Run migrations in a dedicated job or include prisma CLI in production dependencies." >&2
    exit 1
  fi
  node prisma/seed.js
fi

exec "$@"