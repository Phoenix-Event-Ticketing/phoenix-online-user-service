import prisma from '../db/client.js';

const ALLOWED_ROLES = new Set(['USER', 'ORGANIZER', 'ADMIN']);

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: { select: { name: true } },
    },
  });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role?.name ?? null,
  };
}

export async function updateProfile(userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
    },
    select: { id: true, email: true, name: true, role: { select: { name: true } } },
  });
  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role?.name ?? null,
  };
}

export async function assignRole(userId, roleName) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    const err = new Error('Role not found');
    err.statusCode = 400;
    throw err;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  await prisma.user.update({
    where: { id: userId },
    data: { roleId: role.id },
  });
  return getProfile(userId);
}

export async function batchLookup(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  return users;
}

export async function listUsers({ page = 1, pageSize = 10, q, role } = {}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0
    ? Math.min(Math.floor(pageSize), 100)
    : 10;
  const search = typeof q === 'string' ? q.trim() : '';
  const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';

  const where = {};
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ];
  }
  if (normalizedRole && ALLOWED_ROLES.has(normalizedRole)) {
    where.role = { name: normalizedRole };
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        role: { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  return {
    items: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role?.name ?? null,
    })),
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    },
  };
}
