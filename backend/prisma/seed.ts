import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedCurrencies } from './seeds/currencies.seed';
import { seedDiscountReasons } from './seeds/discount-reasons.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for تراث المندي Restaurant...');

  // Seed discount reasons
  await seedDiscountReasons(prisma);

  // Seed currencies
  await seedCurrencies(prisma);

  // Create admin user
  const adminPassword = 'Admin123!@#';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      branchId: null, // Admin has access to all branches
    },
    create: {
      username: 'admin',
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      branchId: null, // Admin has access to all branches
    },
  });

  console.log('✅ Created admin user:', {
    username: admin.username,
    role: admin.role,
    password: adminPassword,
  });

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('📝 Default Credentials:');
  console.log('═══════════════════════════════════════════════');
  console.log('  Admin:');
  console.log(`    Username: admin`);
  console.log(`    Password: ${adminPassword}`);
  console.log('═══════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
