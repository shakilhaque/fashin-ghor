import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/common/utils/slugify.util';

const prisma = new PrismaClient();

const NEW_CATEGORIES = ['Cotton Wear', 'Party Wear', 'Premium Wear', 'Nowra'];
const OLD_CATEGORY_SLUGS = ['mens-fashion', 'womens-fashion', 'kids-fashion', 'accessories'];
const REASSIGN_PRODUCT_SKU_OR_NAME = 'Pakistani Dress';
const REASSIGN_TO_CATEGORY = 'Party Wear';

async function main() {
  console.warn('🧭 Updating nav categories...');

  const createdIds: Record<string, string> = {};
  for (const name of NEW_CATEGORIES) {
    const slug = slugify(name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: { isActive: true },
      create: { name, slug, isActive: true },
    });
    createdIds[name] = category.id;
    console.warn(`  ✅ Category ready: ${name}`);
  }

  const product = await prisma.product.findFirst({ where: { name: REASSIGN_PRODUCT_SKU_OR_NAME } });
  if (product) {
    await prisma.product.update({
      where: { id: product.id },
      data: { categoryId: createdIds[REASSIGN_TO_CATEGORY] },
    });
    console.warn(`  ✅ Moved "${product.name}" → ${REASSIGN_TO_CATEGORY}`);
  } else {
    console.warn(`  - Product "${REASSIGN_PRODUCT_SKU_OR_NAME}" not found, skipped reassignment.`);
  }

  for (const slug of OLD_CATEGORY_SLUGS) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      console.warn(`  - ${slug}: not found, skipped.`);
      continue;
    }
    await prisma.category.update({ where: { slug }, data: { isActive: false } });
    console.warn(`  ✅ Deactivated old category: ${category.name}`);
  }

  console.warn('🎉 Nav category update complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
