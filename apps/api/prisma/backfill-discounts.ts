import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function computeDiscountPct(price: number, comparePrice: number | null): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

async function main() {
  console.warn('🧮 Backfilling product discount percentages from comparePrice...');

  const products = await prisma.product.findMany({
    select: { id: true, name: true, price: true, comparePrice: true, discount: true },
  });

  let updated = 0;
  for (const p of products) {
    const correct = computeDiscountPct(p.price, p.comparePrice);
    if (correct !== p.discount) {
      await prisma.product.update({ where: { id: p.id }, data: { discount: correct } });
      console.warn(`  ✅ ${p.name}: discount ${p.discount}% → ${correct}%`);
      updated++;
    }
  }

  console.warn(`🎉 Done — ${updated} of ${products.length} products updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
