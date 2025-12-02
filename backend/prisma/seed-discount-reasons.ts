import { PrismaClient } from '@prisma/client';

const DEFAULT_DISCOUNT_REASONS = [
  { reason: 'مجاملة', description: 'معاملة مجاملة', isDefault: true, sortOrder: 1 },
  { reason: 'حساب الصندوق', description: 'تعديل حساب الصندوق', isDefault: true, sortOrder: 2 },
  { reason: 'طاولة', description: 'معاملة طاولة', isDefault: true, sortOrder: 3 },
  { reason: 'خصم العميل', description: 'خصم خاص للعميل', isDefault: true, sortOrder: 4 },
  { reason: 'خصم موسمي', description: 'خصم عرض موسمي', isDefault: true, sortOrder: 5 },
];

export async function seedDiscountReasons(prisma: PrismaClient) {
  console.log('Seeding discount reasons...');

  for (const reason of DEFAULT_DISCOUNT_REASONS) {
    await prisma.discountReason.upsert({
      where: { reason: reason.reason },
      update: reason,
      create: reason,
    });
  }

  console.log('✅ Discount reasons seeded successfully');
}

// This allows the script to be run directly for testing or stand-alone execution
if (require.main === module) {
  const prisma = new PrismaClient();
  seedDiscountReasons(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
