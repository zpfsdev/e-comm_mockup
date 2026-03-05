/**
 * One-time migration: deduplicates age_ranges rows so @@unique([minAge, maxAge]) can be applied.
 * Keeps the LOWEST id per (minAge, maxAge) group and re-points any products that reference
 * the duplicated ids to the surviving row before deleting the duplicates.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const all = await prisma.ageRange.findMany({ orderBy: { id: 'asc' } });

  const seen = new Map<string, number>();
  const toDelete: number[] = [];

  for (const ar of all) {
    const key = `${ar.minAge}-${String(ar.maxAge)}`;
    if (seen.has(key)) {
      toDelete.push(ar.id);
    } else {
      seen.set(key, ar.id);
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicate age ranges found.');
    return;
  }

  console.log(`Deduplicating ${toDelete.length} age range(s): ids ${toDelete.join(', ')}`);

  for (const duplicateId of toDelete) {
    const dup = all.find((a) => a.id === duplicateId)!;
    const key = `${dup.minAge}-${String(dup.maxAge)}`;
    const keepId = seen.get(key)!;

    const moved = await prisma.product.updateMany({
      where: { ageRangeId: duplicateId },
      data: { ageRangeId: keepId },
    });
    if (moved.count > 0) {
      console.log(`  Re-pointed ${moved.count} product(s) from ageRangeId ${duplicateId} → ${keepId}`);
    }

    await prisma.ageRange.delete({ where: { id: duplicateId } });
    console.log(`  Deleted duplicate ageRange id=${duplicateId} (${dup.label ?? key})`);
  }

  console.log('Done. Age range duplicates removed.');
}

main()
  .catch((error: Error) => {
    console.error('Cleanup failed:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
