import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { slugify } from '../src/common/utils/slugify.util';

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

  // Products
  const categoryBySlug = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c]));
  const brandBySlug = Object.fromEntries((await prisma.brand.findMany()).map((b) => [b.slug, b]));

  const productSeeds = [
    {
      sku: 'MENS-SHIRT-001',
      name: 'Classic Oxford Shirt',
      description:
        'A timeless oxford shirt crafted from premium breathable cotton, perfect for both office and casual wear.',
      price: 49.99,
      comparePrice: 64.99,
      discount: 23,
      categorySlug: 'mens-fashion',
      brandSlug: 'luxemode-originals',
      gender: 'MEN' as const,
      tags: ['shirt', 'formal', 'cotton'],
      isFeatured: true,
      images: [
        'https://picsum.photos/seed/oxford-shirt-1/800/1000',
        'https://picsum.photos/seed/oxford-shirt-2/800/1000',
      ],
      variants: [
        { sku: 'MENS-SHIRT-001-WHT-M', color: 'White', size: 'M', stock: 20 },
        { sku: 'MENS-SHIRT-001-WHT-L', color: 'White', size: 'L', stock: 15 },
        { sku: 'MENS-SHIRT-001-BLU-M', color: 'Blue', size: 'M', stock: 10 },
      ],
    },
    {
      sku: 'MENS-JEANS-001',
      name: 'Slim Fit Denim Jeans',
      description: 'Modern slim-fit jeans with a touch of stretch for all-day comfort.',
      price: 59.99,
      categorySlug: 'mens-fashion',
      brandSlug: 'urban-thread',
      gender: 'MEN' as const,
      tags: ['jeans', 'denim'],
      isFeatured: false,
      images: ['https://picsum.photos/seed/denim-jeans-1/800/1000'],
      variants: [
        { sku: 'MENS-JEANS-001-30', size: '30', stock: 12 },
        { sku: 'MENS-JEANS-001-32', size: '32', stock: 18 },
        { sku: 'MENS-JEANS-001-34', size: '34', stock: 9 },
      ],
    },
    {
      sku: 'WOMENS-DRESS-001',
      name: 'Floral Summer Dress',
      description: 'A breezy floral dress in lightweight viscose, designed for warm-weather elegance.',
      price: 54.99,
      comparePrice: 79.99,
      discount: 31,
      categorySlug: 'womens-fashion',
      brandSlug: 'emerald-studio',
      gender: 'WOMEN' as const,
      tags: ['dress', 'summer', 'floral'],
      isFeatured: true,
      images: [
        'https://picsum.photos/seed/floral-dress-1/800/1000',
        'https://picsum.photos/seed/floral-dress-2/800/1000',
      ],
      variants: [
        { sku: 'WOMENS-DRESS-001-S', size: 'S', stock: 14 },
        { sku: 'WOMENS-DRESS-001-M', size: 'M', stock: 16 },
        { sku: 'WOMENS-DRESS-001-L', size: 'L', stock: 8 },
      ],
    },
    {
      sku: 'WOMENS-COAT-001',
      name: 'Wool Blend Coat',
      description: 'An elevated wool-blend coat with a tailored silhouette for cold-weather sophistication.',
      price: 149.99,
      categorySlug: 'womens-fashion',
      brandSlug: 'emerald-studio',
      gender: 'WOMEN' as const,
      tags: ['coat', 'wool', 'outerwear'],
      isFeatured: false,
      images: ['https://picsum.photos/seed/wool-coat-1/800/1000'],
      variants: [
        { sku: 'WOMENS-COAT-001-S', size: 'S', stock: 6 },
        { sku: 'WOMENS-COAT-001-M', size: 'M', stock: 7 },
      ],
    },
    {
      sku: 'ACC-BAG-001',
      name: 'Leather Crossbody Bag',
      description: 'A compact genuine-leather crossbody bag with adjustable strap and brushed-gold hardware.',
      price: 89.99,
      categorySlug: 'accessories',
      brandSlug: 'luxemode-originals',
      gender: 'UNISEX' as const,
      tags: ['bag', 'leather', 'accessory'],
      isFeatured: true,
      images: ['https://picsum.photos/seed/crossbody-bag-1/800/1000'],
      stock: 25,
      variants: [],
    },
    {
      sku: 'KIDS-TEE-001',
      name: 'Kids Graphic Tee',
      description: 'A soft, durable cotton tee with a playful printed graphic, built for everyday adventures.',
      price: 19.99,
      categorySlug: 'kids-fashion',
      brandSlug: 'urban-thread',
      gender: 'KIDS' as const,
      tags: ['tee', 'kids', 'cotton'],
      isFeatured: false,
      images: ['https://picsum.photos/seed/kids-tee-1/800/1000'],
      variants: [
        { sku: 'KIDS-TEE-001-4Y', size: '4Y', stock: 20 },
        { sku: 'KIDS-TEE-001-6Y', size: '6Y', stock: 20 },
        { sku: 'KIDS-TEE-001-8Y', size: '8Y', stock: 15 },
      ],
    },
  ];

  for (const p of productSeeds) {
    const category = categoryBySlug[p.categorySlug];
    const brand = brandBySlug[p.brandSlug];
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        discount: p.discount ?? 0,
      },
      create: {
        sku: p.sku,
        name: p.name,
        slug: slugify(p.name),
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        discount: p.discount ?? 0,
        stock: p.stock ?? 0,
        gender: p.gender,
        tags: p.tags,
        isFeatured: p.isFeatured,
        category: category ? { connect: { id: category.id } } : undefined,
        brand: brand ? { connect: { id: brand.id } } : undefined,
        images: { create: p.images.map((url, index) => ({ url, position: index })) },
        variants: { create: p.variants },
      },
    });
  }
  console.warn(`✅ ${productSeeds.length} products seeded`);

  // Inventory — seed per-warehouse stock for each product/variant
  const allProducts = await prisma.product.findMany({ include: { variants: true } });
  for (const product of allProducts) {
    if (product.variants.length === 0) {
      // product-level stock
      await prisma.inventory.upsert({
        where: { id: (await prisma.inventory.findFirst({ where: { productId: product.id, variantId: null, warehouseId: warehouse.id } }))?.id ?? 'nonexistent' },
        update: {},
        create: { productId: product.id, variantId: undefined, warehouseId: warehouse.id, quantity: product.stock, lowStockAt: 5 },
      });
    } else {
      for (const variant of product.variants) {
        const existing = await prisma.inventory.findFirst({ where: { productId: product.id, variantId: variant.id, warehouseId: warehouse.id } });
        if (!existing) {
          await prisma.inventory.create({
            data: { productId: product.id, variantId: variant.id, warehouseId: warehouse.id, quantity: variant.stock, lowStockAt: 5 },
          });
        }
      }
    }
  }
  console.warn(`✅ Inventory seeded for ${allProducts.length} products in main warehouse`);

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

  // Shipping Zones & Rates
  const bdZone = await prisma.shippingZone.upsert({
    where: { id: 'zone-bd-001' },
    update: {},
    create: { id: 'zone-bd-001', name: 'Bangladesh', countries: ['BD'], cities: [], isActive: true },
  });
  const shippingRates = [
    { id: 'rate-standard', name: 'Standard Delivery (3–5 days)', rate: 80, minOrderAmt: 0, isFree: false },
    { id: 'rate-express', name: 'Express Delivery (1–2 days)', rate: 150, minOrderAmt: 0, isFree: false },
    { id: 'rate-free', name: 'Free Delivery (orders ≥ ৳500)', rate: 0, minOrderAmt: 500, isFree: true },
  ];
  for (const r of shippingRates) {
    await prisma.shippingRate.upsert({
      where: { id: r.id },
      update: {},
      create: { id: r.id, zoneId: bdZone.id, name: r.name, rate: r.rate, minOrderAmt: r.minOrderAmt, isFree: r.isFree },
    });
  }
  console.warn(`✅ ${shippingRates.length} shipping rates seeded`);

  // Test coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minOrderAmt: 200,
      maxDiscount: 500,
      usageLimit: 100,
      isActive: true,
      expiresAt: new Date('2027-12-31'),
    },
  });
  await prisma.coupon.upsert({
    where: { code: 'FLAT50' },
    update: {},
    create: {
      code: 'FLAT50',
      type: 'FIXED',
      value: 50,
      minOrderAmt: 300,
      isActive: true,
      expiresAt: new Date('2027-12-31'),
    },
  });
  console.warn('✅ 2 test coupons seeded (WELCOME10, FLAT50)');

  console.warn('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
