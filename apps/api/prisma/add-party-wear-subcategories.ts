import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/common/utils/slugify.util';

const prisma = new PrismaClient();

const PARENT_CATEGORY = 'Party Wear';
const SUBCATEGORIES = ['Party Wear Stitched', 'Party Wear Unstitched'];

async function main() {
  console.warn('🧭 Adding Party Wear subcategories...');

  const parentSlug = slugify(PARENT_CATEGORY);
  const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });

  if (!parent) {
    console.warn(`  ❌ Parent category "${PARENT_CATEGORY}" (slug: ${parentSlug}) not found. Aborting.`);
    process.exit(1);
  }

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

  console.warn('🎉 Party Wear subcategories complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
