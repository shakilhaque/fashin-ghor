import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.warn('🌱 Seeding database...');

  // Super admin
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@luxemode.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@luxemode.com',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
    },
  });
  console.warn(`✅ Admin user: ${admin.email}`);

  // Default warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      name: 'Main Warehouse',
      code: 'MAIN',
      address: '123 Fashion Street',
      city: 'Dhaka',
      isDefault: true,
    },
  });
  console.warn(`✅ Warehouse: ${warehouse.name}`);

  // Categories
  const categories = [
    { name: "Men's Fashion", slug: 'mens-fashion' },
    { name: "Women's Fashion", slug: 'womens-fashion' },
    { name: "Kids' Fashion", slug: 'kids-fashion' },
    { name: 'Accessories', slug: 'accessories' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug },
    });
  }
  console.warn(`✅ ${categories.length} categories seeded`);

  // Brands
  const brands = [
    { name: 'LuxeMode Originals', slug: 'luxemode-originals', country: 'BD' },
    { name: 'Urban Thread', slug: 'urban-thread', country: 'BD' },
    { name: 'Emerald Studio', slug: 'emerald-studio', country: 'BD' },
  ];
  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: { name: brand.name, slug: brand.slug, country: brand.country },
    });
  }
  console.warn(`✅ ${brands.length} brands seeded`);

  // Settings
  const settings = [
    { key: 'site_name', value: 'LuxeMode', group: 'general', isPublic: true },
    { key: 'site_currency', value: 'BDT', group: 'general', isPublic: true },
    { key: 'site_phone', value: '+880 1700-000000', group: 'contact', isPublic: true },
    { key: 'site_email', value: 'hello@luxemode.com', group: 'contact', isPublic: true },
    { key: 'low_stock_threshold', value: 10, group: 'inventory', isPublic: false },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value, group: s.group, isPublic: s.isPublic },
    });
  }
  console.warn(`✅ ${settings.length} settings seeded`);

  console.warn('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
