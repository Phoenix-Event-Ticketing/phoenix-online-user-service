import prisma from '../db/client.js';

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
