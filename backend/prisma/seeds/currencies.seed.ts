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
      name_ar: 'دينار عراقي',
      name_en: 'Iraqi Dinar',
      symbol: 'د.ع',
      is_default: true,
    },
    {
      code: 'USD',
      name_ar: 'دولار أمريكي',
      name_en: 'US Dollar',
      symbol: '$',
      is_default: false,
    },
    {
      code: 'EUR',
      name_ar: 'يورو',
      name_en: 'Euro',
      symbol: '€',
      is_default: false,
    },
    {
      code: 'SYP',
      name_ar: 'ليرة سورية',
      name_en: 'Syrian Pound',
      symbol: 'ل.س',
      is_default: false,
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
