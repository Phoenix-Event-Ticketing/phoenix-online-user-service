import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@phoenix.local';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMeOnFirstLogin!';
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'Super Admin';

const ROLES = [
  { name: 'USER', description: 'Regular customers' },
  { name: 'ORGANIZER', description: 'Event creators' },
  { name: 'ADMIN', description: 'Platform administrators' },
];

const PERMISSIONS = [
  // User Service
  { name: 'VIEW_PROFILE', description: 'View own profile' },
  { name: 'UPDATE_PROFILE', description: 'Update profile' },
  { name: 'DELETE_ACCOUNT', description: 'Delete own account' },
  { name: 'VIEW_USERS', description: 'List users (admin)' },
  { name: 'MANAGE_USERS', description: 'Create/update/delete users' },
  { name: 'ASSIGN_ROLE', description: 'Assign roles' },
  // Event Service
  { name: 'VIEW_EVENTS', description: 'View event catalog' },
  { name: 'CREATE_EVENT', description: 'Create events' },
  { name: 'UPDATE_EVENT', description: 'Update events' },
  { name: 'DELETE_EVENT', description: 'Remove events' },
  { name: 'PUBLISH_EVENT', description: 'Publish event' },
  // Ticket Inventory Service
  { name: 'VIEW_TICKET_INVENTORY', description: 'View ticket availability' },
  { name: 'CREATE_TICKET_TYPE', description: 'Create ticket categories' },
  { name: 'UPDATE_TICKET_INVENTORY', description: 'Update seat counts' },
  { name: 'DELETE_TICKET_TYPE', description: 'Remove ticket types' },
  { name: 'RESERVE_TICKET', description: 'Reserve ticket during booking' },
  // Booking Service
  { name: 'CREATE_BOOKING', description: 'Create booking' },
  { name: 'VIEW_BOOKINGS', description: 'View own bookings' },
  { name: 'CANCEL_BOOKING', description: 'Cancel booking' },
  { name: 'UPDATE_BOOKING', description: 'Modify booking' },
  { name: 'VIEW_ALL_BOOKINGS', description: 'Admin booking view' },
  // Payment Service
  { name: 'INITIATE_PAYMENT', description: 'Start payment' },
  { name: 'PROCESS_PAYMENT', description: 'Complete payment' },
  { name: 'VIEW_PAYMENT', description: 'View payment details' },
  { name: 'REFUND_PAYMENT', description: 'Refund payment' },
  { name: 'VIEW_ALL_PAYMENTS', description: 'Admin payment view' },
];

async function main() {
  const roleIds = {};
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      create: r,
      update: { description: r.description },
    });
    roleIds[r.name] = role.id;
  }

  const permissionIds = {};
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      create: p,
      update: { description: p.description },
    });
    permissionIds[p.name] = perm.id;
  }

  const userPerms = [
    'VIEW_PROFILE', 'UPDATE_PROFILE', 'DELETE_ACCOUNT',
    'VIEW_EVENTS', 'VIEW_TICKET_INVENTORY', 'RESERVE_TICKET',
    'CREATE_BOOKING', 'VIEW_BOOKINGS', 'CANCEL_BOOKING',
    'INITIATE_PAYMENT', 'VIEW_PAYMENT',
  ];
  for (const name of userPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleIds.USER,
          permissionId: permissionIds[name],
        },
      },
      create: { roleId: roleIds.USER, permissionId: permissionIds[name] },
      update: {},
    });
  }

  const organizerPerms = [
    ...userPerms,
    'CREATE_EVENT', 'UPDATE_EVENT', 'DELETE_EVENT', 'PUBLISH_EVENT',
    'CREATE_TICKET_TYPE', 'UPDATE_TICKET_INVENTORY', 'DELETE_TICKET_TYPE',
  ];
  for (const name of organizerPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleIds.ORGANIZER,
          permissionId: permissionIds[name],
        },
      },
      create: { roleId: roleIds.ORGANIZER, permissionId: permissionIds[name] },
      update: {},
    });
  }

  for (const p of PERMISSIONS) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleIds.ADMIN,
          permissionId: permissionIds[p.name],
        },
      },
      create: { roleId: roleIds.ADMIN, permissionId: permissionIds[p.name] },
      update: {},
    });
  }

  const superAdminPasswordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    create: {
      email: SUPER_ADMIN_EMAIL,
      passwordHash: superAdminPasswordHash,
      name: SUPER_ADMIN_NAME,
      roleId: roleIds.ADMIN,
      status: 'ACTIVE',
    },
    update: {
      passwordHash: superAdminPasswordHash,
      name: SUPER_ADMIN_NAME,
      roleId: roleIds.ADMIN,
      status: 'ACTIVE',
    },
  });

  console.log('Seeded roles, permissions, role_permissions, and super admin user.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
