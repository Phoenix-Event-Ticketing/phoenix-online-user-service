#!/bin/sh
set -e

if [ "$MIGRATE_ON_START" = "true" ]; then
  npx prisma migrate deploy
fi

exec "$@"