import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.setting.findUnique({ where: { key: 'site_name' } });
  if (!setting) {
    console.warn('  - "site_name" setting not found, nothing to update.');
    return;
  }
  await prisma.setting.update({ where: { key: 'site_name' }, data: { value: 'Fashion Ghor' } });
  console.warn(`✅ Updated "site_name" setting: "${setting.value}" → "Fashion Ghor"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
