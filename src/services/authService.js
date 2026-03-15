import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/client.js';
import config from '../config/index.js';

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function register({ email, password, name }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }
  const defaultRole = await prisma.role.findUnique({ where: { name: 'USER' } });
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
      roleId: defaultRole?.id ?? null,
    },
    select: { id: true, email: true, name: true },
  });
  return user;
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  if (user.status !== 'ACTIVE') {
    const err = new Error('Account is not active');
    err.statusCode = 403;
    throw err;
  }
  const permissions = (user.role?.rolePermissions || []).map((rp) => rp.permission.name);
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role?.name ?? null,
    permissions,
  };
  const expiresInSeconds = parseInt(config.jwt.expiresIn, 10) || 3600;
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: expiresInSeconds,
  });
  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresInSeconds,
  };
}
