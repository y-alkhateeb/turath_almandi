/**
 * Currency Settings Seed Data
 *
 * Seeds the database with common currencies for the restaurant system.
 * IQD is set as the default currency.
 */

import { PrismaClient } from '@prisma/client';

export async function seedCurrencies(prisma: PrismaClient) {
  console.log('💱 Seeding currencies...');

  const currencies = [
    {
      code: 'IQD',
      nameAr: 'دينار عراقي',
      nameEn: 'Iraqi Dinar',
      symbol: 'د.ع',
      isDefault: true,
    },
    {
      code: 'USD',
      nameAr: 'دولار أمريكي',
      nameEn: 'US Dollar',
      symbol: '$',
      isDefault: false,
    },
    {
      code: 'EUR',
      nameAr: 'يورو',
      nameEn: 'Euro',
      symbol: '€',
      isDefault: false,
    },
    {
      code: 'SYP',
      nameAr: 'ليرة سورية',
      nameEn: 'Syrian Pound',
      symbol: 'ل.س',
      isDefault: false,
    },
  ];

  for (const currency of currencies) {
    await prisma.currencySettings.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }

  console.log('✅ Created currencies:', currencies.map(c => `${c.code} (${c.symbol})`).join(', '));
}
