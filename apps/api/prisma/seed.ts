import 'dotenv/config';
import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedRoles();
  await seedAgeRanges();
  await seedCategories();
  await seedLocation();
}

async function seedRoles(): Promise<void> {
  const roles = [RoleName.Admin, RoleName.Customer, RoleName.Seller];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }
  console.log('Roles seeded.');
}

async function seedAgeRanges(): Promise<void> {
  const ageRanges = [
    { minAge: 0, maxAge: 1, label: 'Infant (0–1 yr)' },
    { minAge: 1, maxAge: 2, label: 'Toddler (1–2 yrs)' },
    { minAge: 2, maxAge: 3, label: 'Early Preschool (2–3 yrs)' },
    { minAge: 3, maxAge: 4, label: 'Preschool (3–4 yrs)' },
    { minAge: 4, maxAge: 5, label: 'Pre-K (4–5 yrs)' },
    { minAge: 5, maxAge: 6, label: 'Kindergarten (5–6 yrs)' },
    { minAge: 6, maxAge: 7, label: 'Early Primary (6–7 yrs)' },
  ];
  for (const range of ageRanges) {
    await prisma.ageRange.upsert({
      where: { id: ageRanges.indexOf(range) + 1 },
      update: {},
      create: range,
    });
  }
  console.log('Age ranges seeded.');
}

async function seedCategories(): Promise<void> {
  const categories = [
    { categoryName: 'Coloring Materials', description: 'Crayons, markers, colored pencils, and other coloring tools for kids.' },
    { categoryName: 'Coloring Books', description: 'Books designed for children to color, including themes like animals, alphabets, and shapes.' },
    { categoryName: 'Puzzles', description: 'Jigsaw puzzles, matching puzzles, and brain-teaser games for early learners.' },
    { categoryName: 'Worksheets', description: 'Worksheets for learning numbers, letters, and shapes.' },
    { categoryName: 'Story Books', description: 'Children\'s storybooks for early literacy and imagination development.' },
    { categoryName: 'Board Games', description: 'Simple board games suitable for kids to develop problem-solving and social skills.' },
    { categoryName: 'Charts', description: 'Educational charts for alphabets, numbers, colors, and basic concepts.' },
    { categoryName: 'Basic Educational Books', description: 'Books covering early learning concepts such as ABCs, counting, and shapes.' },
    { categoryName: 'Sensory Toys', description: 'Toys designed to stimulate touch, sight, and sound for infants and toddlers.' },
    { categoryName: 'Learning Kits', description: 'Complete kits including multiple materials for early childhood learning activities.' },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { categoryName: category.categoryName },
      update: {},
      create: category,
    });
  }
  console.log('Categories seeded.');
}

async function seedLocation(): Promise<void> {
  const province = await prisma.province.upsert({
    where: { province: 'Albay' },
    update: {},
    create: { province: 'Albay' },
  });

  const cities = [
    { city: 'Bacacay',      postalCode: '4509' },
    { city: 'Camalig',      postalCode: '4502' },
    { city: 'Daraga',       postalCode: '4501' },
    { city: 'Guinobatan',   postalCode: '4503' },
    { city: 'Jovellar',     postalCode: '4515' },
    { city: 'Legazpi City', postalCode: '4500' },
    { city: 'Libon',        postalCode: '4507' },
    { city: 'Ligao',        postalCode: '4504' },
    { city: 'Malilipot',    postalCode: '4510' },
    { city: 'Malinao',      postalCode: '4512' },
    { city: 'Manito',       postalCode: '4514' },
    { city: 'Oas',          postalCode: '4504' },
    { city: 'Pio Duran',    postalCode: '4516' },
    { city: 'Polangui',     postalCode: '4506' },
    { city: 'Rapu-Rapu',    postalCode: '4517' },
    { city: 'Santo Domingo',postalCode: '4508' },
    { city: 'Tabaco',       postalCode: '4511' },
    { city: 'Tiwi',         postalCode: '4513' },
  ];

  for (const cityData of cities) {
    await prisma.city.upsert({
      where: { city_provinceId: { city: cityData.city, provinceId: province.id } },
      update: {},
      create: { ...cityData, provinceId: province.id },
    });
  }
  console.log('Location data seeded (Albay province, 18 cities).');
}

main()
  .catch((error: Error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
