import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin123!@#', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample categories
  const appetizers = await prisma.category.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Appetizers',
      description: 'Starters and small dishes',
      isActive: true,
    },
  });

  const mainCourses = await prisma.category.upsert({
    where: { id: '2' },
    update: {},
    create: {
      id: '2',
      name: 'Main Courses',
      description: 'Main dishes',
      isActive: true,
    },
  });

  const beverages = await prisma.category.upsert({
    where: { id: '3' },
    update: {},
    create: {
      id: '3',
      name: 'Beverages',
      description: 'Drinks and beverages',
      isActive: true,
    },
  });

  console.log('✅ Created categories');

  // Create sample menu items
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Hummus',
        description: 'Traditional chickpea dip',
        price: 8.99,
        cost: 3.50,
        categoryId: appetizers.id,
        isAvailable: true,
      },
      {
        name: 'Falafel',
        description: 'Crispy chickpea fritters',
        price: 10.99,
        cost: 4.00,
        categoryId: appetizers.id,
        isAvailable: true,
      },
      {
        name: 'Grilled Chicken',
        description: 'Tender grilled chicken with vegetables',
        price: 24.99,
        cost: 12.00,
        categoryId: mainCourses.id,
        isAvailable: true,
      },
      {
        name: 'Lamb Kebab',
        description: 'Marinated lamb skewers',
        price: 28.99,
        cost: 15.00,
        categoryId: mainCourses.id,
        isAvailable: true,
      },
      {
        name: 'Fresh Juice',
        description: 'Freshly squeezed fruit juice',
        price: 5.99,
        cost: 2.00,
        categoryId: beverages.id,
        isAvailable: true,
      },
      {
        name: 'Arabic Coffee',
        description: 'Traditional Arabic coffee',
        price: 4.99,
        cost: 1.50,
        categoryId: beverages.id,
        isAvailable: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created menu items');

  // Create sample inventory items
  await prisma.inventory.createMany({
    data: [
      {
        itemName: 'Chickpeas',
        quantity: 50,
        unit: 'kg',
        cost: 3.50,
        supplier: 'Local Supplier',
      },
      {
        itemName: 'Chicken Breast',
        quantity: 30,
        unit: 'kg',
        cost: 8.00,
        supplier: 'Meat Supplier',
      },
      {
        itemName: 'Lamb Meat',
        quantity: 20,
        unit: 'kg',
        cost: 15.00,
        supplier: 'Meat Supplier',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created inventory items');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
