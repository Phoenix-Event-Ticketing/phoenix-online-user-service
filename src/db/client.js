import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set');
}

const adapter = new PrismaMariaDb(databaseUrl);

// Query logging is off by default; set PRISMA_LOG_QUERIES=1 to log SQL (e.g. for debugging).
const logLevels =
  process.env.PRISMA_LOG_QUERIES === '1'
    ? ['query', 'info', 'warn', 'error']
    : process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'];

const prisma = new PrismaClient({ adapter, log: logLevels });

export default prisma;
