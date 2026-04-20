#!/usr/bin/env node
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { withConnectionLimit } from '../src/utils/databaseUrl.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(withConnectionLimit(databaseUrl)) });
try {
  await prisma.$connect();
  await prisma.$disconnect();
  process.exit(0);
} catch {
  process.exit(1);
}
