import { PrismaClient } from '@prisma/client';

// Query logging is off by default; set PRISMA_LOG_QUERIES=1 to log SQL (e.g. for debugging).
const logLevels =
  process.env.PRISMA_LOG_QUERIES === '1'
    ? ['query', 'info', 'warn', 'error']
    : process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'];

const prisma = new PrismaClient({ log: logLevels });

export default prisma;
