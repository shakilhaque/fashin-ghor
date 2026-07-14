import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/common/utils/slugify.util';

const prisma = new PrismaClient();

const PARENT_CATEGORY = 'Offer Zone';
// High sortOrder so it lands after the existing nav categories (Cotton Wear,
// Party Wear, Premium Wear, Nowra), which all default to sortOrder 0.
const PARENT_SORT_ORDER = 100;
const SUBCATEGORIES = ['Hot Deals', 'Weekend Special'];

async function main() {
  console.warn('🧭 Adding Offer Zone category...');

  const parentSlug = slugify(PARENT_CATEGORY);
  const parent = await prisma.category.upsert({
    where: { slug: parentSlug },
    update: { isActive: true },
    create: { name: PARENT_CATEGORY, slug: parentSlug, isActive: true, sortOrder: PARENT_SORT_ORDER },
  });
  console.warn(`  ✅ Category ready: ${PARENT_CATEGORY}`);

  for (let i = 0; i < SUBCATEGORIES.length; i++) {
    const name = SUBCATEGORIES[i];
    const slug = slugify(name);
    await prisma.category.upsert({
      where: { slug },
      update: { parentId: parent.id, isActive: true, sortOrder: i },
      create: { name, slug, parentId: parent.id, isActive: true, sortOrder: i },
    });
    console.warn(`  ✅ Subcategory ready: ${name} (under ${PARENT_CATEGORY})`);
  }

  console.warn('🎉 Offer Zone category complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
