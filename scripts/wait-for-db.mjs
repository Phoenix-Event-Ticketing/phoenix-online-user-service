#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  await prisma.$connect();
  await prisma.$disconnect();
  process.exit(0);
} catch {
  process.exit(1);
}
