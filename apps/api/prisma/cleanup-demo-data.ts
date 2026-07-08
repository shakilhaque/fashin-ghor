import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Must exactly match the demo records created by prisma/seed.ts
const DEMO_PRODUCT_SKUS = [
  'MENS-SHIRT-001',
  'MENS-JEANS-001',
  'WOMENS-DRESS-001',
  'WOMENS-COAT-001',
  'ACC-BAG-001',
  'KIDS-TEE-001',
];
const DEMO_BRAND_SLUGS = ['luxemode-originals', 'urban-thread', 'emerald-studio'];
const DEMO_COUPON_CODES = ['WELCOME10', 'FLAT50'];

async function main() {
  console.warn('🧹 Removing demo/seed data...');

  for (const sku of DEMO_PRODUCT_SKUS) {
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product) {
      console.warn(`  - ${sku}: not found (already removed)`);
      continue;
    }
    try {
      // Inventory rows have no cascade from Product, so remove them first.
      await prisma.inventory.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
      console.warn(`  ✅ Deleted product: ${product.name} (${sku})`);
    } catch (err) {
      console.warn(`  ⚠️  Skipped "${product.name}" (${sku}) — likely referenced by a real cart, order, or review:`);
      console.warn(`     ${(err as Error).message.split('\n')[0]}`);
    }
  }

  for (const slug of DEMO_BRAND_SLUGS) {
    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      console.warn(`  - brand "${slug}": not found (already removed)`);
      continue;
    }
    try {
      await prisma.brand.delete({ where: { id: brand.id } });
      console.warn(`  ✅ Deleted brand: ${brand.name}`);
    } catch {
      console.warn(`  ⚠️  Skipped brand "${brand.name}" — still has products attached (a real product may use it now).`);
    }
  }

  for (const code of DEMO_COUPON_CODES) {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) {
      console.warn(`  - coupon "${code}": not found (already removed)`);
      continue;
    }
    await prisma.coupon.delete({ where: { id: coupon.id } });
    console.warn(`  ✅ Deleted coupon: ${code}`);
  }

  console.warn('🎉 Cleanup complete! Categories (Men\'s/Women\'s/Kids\' Fashion, Accessories) were left untouched.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
