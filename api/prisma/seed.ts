import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CITIES = [
  { city: 'Bacacay', postalCode: '4509', provinceId: 1 },
  { city: 'Camalig', postalCode: '4502', provinceId: 1 },
  { city: 'Daraga', postalCode: '4501', provinceId: 1 },
  { city: 'Guinobatan', postalCode: '4503', provinceId: 1 },
  { city: 'Jovellar', postalCode: '4515', provinceId: 1 },
  { city: 'Legazpi City', postalCode: '4500', provinceId: 1 },
  { city: 'Libon', postalCode: '4507', provinceId: 1 },
  { city: 'Ligao', postalCode: '4504', provinceId: 1 },
  { city: 'Malilipot', postalCode: '4510', provinceId: 1 },
  { city: 'Malinao', postalCode: '4512', provinceId: 1 },
  { city: 'Manito', postalCode: '4514', provinceId: 1 },
  { city: 'Oas', postalCode: '4504', provinceId: 1 },
  { city: 'Pio Duran', postalCode: '4516', provinceId: 1 },
  { city: 'Polangui', postalCode: '4506', provinceId: 1 },
  { city: 'Rapu-Rapu', postalCode: '4517', provinceId: 1 },
  { city: 'Santo Domingo', postalCode: '4508', provinceId: 1 },
  { city: 'Tabaco', postalCode: '4511', provinceId: 1 },
  { city: 'Tiwi', postalCode: '4513', provinceId: 1 },
];

const AGE_RANGES = [
  { minAge: 0, maxAge: 1, label: 'Infant (0–1 yr)' },
  { minAge: 1, maxAge: 2, label: 'Toddler (1–2 yrs)' },
  { minAge: 2, maxAge: 3, label: 'Early Preschool (2–3 yrs)' },
  { minAge: 3, maxAge: 4, label: 'Preschool (3–4 yrs)' },
  { minAge: 4, maxAge: 5, label: 'Pre-K (4–5 yrs)' },
  { minAge: 5, maxAge: 6, label: 'Kindergarten (5–6 yrs)' },
  { minAge: 6, maxAge: 7, label: 'Early Primary (6–7 yrs)' },
];

const CATEGORIES = [
  { categoryName: 'Coloring Materials', description: 'Crayons, markers, colored pencils, and other coloring tools for kids.' },
  { categoryName: 'Coloring Books', description: 'Books designed for children to color, including themes like animals, alphabets, and shapes.' },
  { categoryName: 'Puzzles', description: 'Jigsaw puzzles, matching puzzles, and brain-teaser games for early learners.' },
  { categoryName: 'Worksheets', description: 'Worksheets for learning numbers, letters, and shapes.' },
  { categoryName: 'Story Books', description: "Children's storybooks for early literacy and imagination development." },
  { categoryName: 'Board Games', description: 'Simple board games suitable for kids to develop problem-solving and social skills.' },
  { categoryName: 'Charts', description: 'Educational charts for alphabets, numbers, colors, and basic concepts.' },
  { categoryName: 'Basic Educational Books', description: 'Books covering early learning concepts such as ABCs, counting, and shapes.' },
  { categoryName: 'Sensory Toys', description: 'Toys designed to stimulate touch, sight, and sound for infants and toddlers.' },
  { categoryName: 'Learning Kits', description: 'Complete kits including multiple materials for early childhood learning activities.' },
];

/** Sample barangays - full list in project details.md; run full seed separately if needed */
const BARANGAYS_SAMPLE: { barangay: string; cityId: number }[] = [
  { barangay: 'Barangay 1 (Pob.)', cityId: 1 },
  { barangay: 'Barangay 2 (Pob.)', cityId: 1 },
  { barangay: 'Bariw', cityId: 1 },
  { barangay: 'Basud', cityId: 1 },
  { barangay: 'Sogod', cityId: 1 },
  { barangay: 'Barangay 1 (Pob.)', cityId: 2 },
  { barangay: 'Poblacion', cityId: 6 },
];

async function main(): Promise<void> {
  await prisma.role.createMany({
    data: [
      { roleName: 'Admin' },
      { roleName: 'Customer' },
      { roleName: 'Seller' },
    ],
    skipDuplicates: true,
  });

  await prisma.province.createMany({
    data: [{ province: 'Albay' }],
    skipDuplicates: true,
  });

  const province = await prisma.province.findFirst({ where: { province: 'Albay' } });
  if (!province) {
    throw new Error('Province not created');
  }

  for (const c of CITIES) {
    await prisma.city.upsert({
      where: { city_provinceId: { city: c.city, provinceId: province.provinceId } },
      create: { city: c.city, postalCode: c.postalCode, provinceId: province.provinceId },
      update: {},
    });
  }

  const existingAgeRanges = await prisma.ageRange.count();
  if (existingAgeRanges === 0) {
    await prisma.ageRange.createMany({ data: AGE_RANGES });
  }

  await prisma.category.createMany({
    data: CATEGORIES,
    skipDuplicates: true,
  });

  await prisma.barangay.createMany({
    data: BARANGAYS_SAMPLE,
    skipDuplicates: true,
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
