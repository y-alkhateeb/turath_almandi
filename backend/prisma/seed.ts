import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for تراث المندي Restaurant...');

  // Create sample branches first
  const mainBranch = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'الفرع الرئيسي',
      location: 'بغداد - المنصور',
      managerName: 'أحمد محمد',
      phone: '+964 770 123 4567',
      isActive: true,
    },
  });

  const secondBranch = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'فرع الكرادة',
      location: 'بغداد - الكرادة',
      managerName: 'علي حسن',
      phone: '+964 771 234 5678',
      isActive: true,
    },
  });

  console.log('✅ Created branches');

  // Create admin user
  const adminPassword = 'Admin123!@#';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      isActive: true,
      branchId: null, // Admin has access to all branches
    },
    create: {
      username: 'admin',
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      isActive: true,
      branchId: null, // Admin has access to all branches
    },
  });

  console.log('✅ Created admin user:', {
    username: admin.username,
    role: admin.role,
    password: adminPassword,
  });

  // Create accountant users for each branch
  const accountant1Password = 'Accountant123';
  const hashedAccountant1Password = await bcrypt.hash(accountant1Password, 10);

  const accountant1 = await prisma.user.upsert({
    where: { username: 'accountant1' },
    update: {
      passwordHash: hashedAccountant1Password,
      role: 'ACCOUNTANT',
      branchId: mainBranch.id,
      isActive: true,
    },
    create: {
      username: 'accountant1',
      passwordHash: hashedAccountant1Password,
      role: 'ACCOUNTANT',
      branchId: mainBranch.id,
      isActive: true,
    },
  });

  const accountant2Password = 'Accountant123';
  const hashedAccountant2Password = await bcrypt.hash(accountant2Password, 10);

  const accountant2 = await prisma.user.upsert({
    where: { username: 'accountant2' },
    update: {
      passwordHash: hashedAccountant2Password,
      role: 'ACCOUNTANT',
      branchId: secondBranch.id,
      isActive: true,
    },
    create: {
      username: 'accountant2',
      passwordHash: hashedAccountant2Password,
      role: 'ACCOUNTANT',
      branchId: secondBranch.id,
      isActive: true,
    },
  });

  console.log('✅ Created accountant users:', {
    accountant1: {
      username: accountant1.username,
      branch: mainBranch.name,
      password: accountant1Password,
    },
    accountant2: {
      username: accountant2.username,
      branch: secondBranch.name,
      password: accountant2Password,
    },
  });

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 ADMIN:');
  console.log('   Username: admin');
  console.log('   Password: Admin123!@#');
  console.log('   Access: All branches');
  console.log('');
  console.log('👤 ACCOUNTANT 1 (الفرع الرئيسي):');
  console.log('   Username: accountant1');
  console.log('   Password: Accountant123');
  console.log('   Branch: الفرع الرئيسي');
  console.log('');
  console.log('👤 ACCOUNTANT 2 (فرع الكرادة):');
  console.log('   Username: accountant2');
  console.log('   Password: Accountant123');
  console.log('   Branch: فرع الكرادة');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
