import 'dotenv/config';
import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function main(): Promise<void> {
  await seedRoles();
  await seedAgeRanges();
  await seedCategories();
  await seedLocation();

  if (process.env.NODE_ENV !== 'production') {
    await seedTestUsers();
    await seedTestProducts();
    await seedTestOrder();
    console.log('Dev test data seeded.');
  }
}

// ─── Reference data ──────────────────────────────────────────────────────────

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
  await prisma.ageRange.createMany({
    skipDuplicates: true,
    data: [
      { minAge: 0, maxAge: 1, label: 'Infant (0–1 yr)' },
      { minAge: 1, maxAge: 2, label: 'Toddler (1–2 yrs)' },
      { minAge: 2, maxAge: 3, label: 'Early Preschool (2–3 yrs)' },
      { minAge: 3, maxAge: 4, label: 'Preschool (3–4 yrs)' },
      { minAge: 4, maxAge: 5, label: 'Pre-K (4–5 yrs)' },
      { minAge: 5, maxAge: 6, label: 'Kindergarten (5–6 yrs)' },
      { minAge: 6, maxAge: 7, label: 'Early Primary (6–7 yrs)' },
    ],
  });
  console.log('Age ranges seeded.');
}

async function seedCategories(): Promise<void> {
  const categories = [
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
    { city: 'Bacacay',       postalCode: '4509' },
    { city: 'Camalig',       postalCode: '4502' },
    { city: 'Daraga',        postalCode: '4501' },
    { city: 'Guinobatan',    postalCode: '4503' },
    { city: 'Jovellar',      postalCode: '4515' },
    { city: 'Legazpi City',  postalCode: '4500' },
    { city: 'Libon',         postalCode: '4507' },
    { city: 'Ligao',         postalCode: '4504' },
    { city: 'Malilipot',     postalCode: '4510' },
    { city: 'Malinao',       postalCode: '4512' },
    { city: 'Manito',        postalCode: '4514' },
    { city: 'Oas',           postalCode: '4504' },
    { city: 'Pio Duran',     postalCode: '4516' },
    { city: 'Polangui',      postalCode: '4506' },
    { city: 'Rapu-Rapu',     postalCode: '4517' },
    { city: 'Santo Domingo', postalCode: '4508' },
    { city: 'Tabaco',        postalCode: '4511' },
    { city: 'Tiwi',          postalCode: '4513' },
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

// ─── Dev-only test users & data ───────────────────────────────────────────────

/**
 * Creates all test accounts used by E2E suites and manual QA.
 *
 * Accounts:
 *   admin@artistryx.test         / TestPass1!  (Admin)
 *   testcustomer@artistryx.test  / TestPass1!  (Customer)
 *   testcustomer2@artistryx.test / TestPass1!  (Customer)
 *   testseller@artistryx.test    / TestPass1!  (Seller + Customer)
 *   testseller2@artistryx.test   / TestPass1!  (Seller + Customer)
 */
async function seedTestUsers(): Promise<void> {
  const [adminRole, customerRole, sellerRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { roleName: RoleName.Admin } }),
    prisma.role.findUniqueOrThrow({ where: { roleName: RoleName.Customer } }),
    prisma.role.findUniqueOrThrow({ where: { roleName: RoleName.Seller } }),
  ]);

  const hash = await bcrypt.hash('TestPass1!', BCRYPT_ROUNDS);

  const legazpiCity = await prisma.city.findFirstOrThrow({
    where: { city: 'Legazpi City' },
  });

  const barangay = await prisma.barangay.upsert({
    where: { barangay_cityId: { barangay: 'Sagpon', cityId: legazpiCity.id } },
    update: {},
    create: { barangay: 'Sagpon', cityId: legazpiCity.id },
  });

  const address = await prisma.address.upsert({
    where: { street_barangayId: { street: '123 Test Street', barangayId: barangay.id } },
    update: {},
    create: { street: '123 Test Street', barangayId: barangay.id },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@artistryx.test' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      username: 'testadmin',
      email: 'admin@artistryx.test',
      password: hash,
      dateOfBirth: new Date('1990-01-01'),
      contactNumber: '09170000001',
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'testcustomer@artistryx.test' },
    update: {},
    create: {
      firstName: 'Test',
      lastName: 'Customer',
      username: 'testcustomer',
      email: 'testcustomer@artistryx.test',
      password: hash,
      dateOfBirth: new Date('1995-06-15'),
      contactNumber: '09171234567',
      userRoles: { create: { roleId: customerRole.id } },
      userAddresses: {
        create: {
          addressId: address.id,
          addressType: 'Home',
          isDefault: true,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'testcustomer2@artistryx.test' },
    update: {},
    create: {
      firstName: 'Second',
      lastName: 'Customer',
      username: 'testcustomer2',
      email: 'testcustomer2@artistryx.test',
      password: hash,
      dateOfBirth: new Date('1997-09-20'),
      contactNumber: '09171234568',
      userRoles: { create: { roleId: customerRole.id } },
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: 'testseller@artistryx.test' },
    update: {},
    create: {
      firstName: 'Test',
      lastName: 'Seller',
      username: 'testseller',
      email: 'testseller@artistryx.test',
      password: hash,
      dateOfBirth: new Date('1990-03-20'),
      contactNumber: '09181234567',
      userRoles: {
        create: [
          { roleId: sellerRole.id },
          { roleId: customerRole.id },
        ],
      },
    },
  });

  const sellerUser2 = await prisma.user.upsert({
    where: { email: 'testseller2@artistryx.test' },
    update: {},
    create: {
      firstName: 'Second',
      lastName: 'Seller',
      username: 'testseller2',
      email: 'testseller2@artistryx.test',
      password: hash,
      dateOfBirth: new Date('1992-07-10'),
      contactNumber: '09181234568',
      userRoles: {
        create: [
          { roleId: sellerRole.id },
          { roleId: customerRole.id },
        ],
      },
    },
  });

  await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      shopName: 'Test Art Shop',
      shopDescription: 'A vibrant shop with premium early childhood learning materials for ages 0–7.',
      shopStatus: 'Active',
    },
  });

  await prisma.seller.upsert({
    where: { userId: sellerUser2.id },
    update: {},
    create: {
      userId: sellerUser2.id,
      shopName: 'Rainbow Learning Hub',
      shopDescription: 'Colorful and engaging learning kits and story books for young learners.',
      shopStatus: 'Active',
    },
  });

  for (const userId of [adminUser.id, customer.id, sellerUser.id, sellerUser2.id]) {
    await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  console.log('Test users seeded: admin, 2 customers, 2 sellers.');
}

async function seedTestProducts(): Promise<void> {
  const seller = await prisma.seller.findFirstOrThrow({
    where: { shopName: 'Test Art Shop' },
  });
  const seller2 = await prisma.seller.findFirstOrThrow({
    where: { shopName: 'Rainbow Learning Hub' },
  });

  const [coloringMaterials, coloringBooks, puzzles, storyBooks, learningKits, sensoryToys] =
    await Promise.all([
      prisma.category.findUniqueOrThrow({ where: { categoryName: 'Coloring Materials' } }),
      prisma.category.findUniqueOrThrow({ where: { categoryName: 'Coloring Books' } }),
      prisma.category.findUniqueOrThrow({ where: { categoryName: 'Puzzles' } }),
      prisma.category.findUniqueOrThrow({ where: { categoryName: 'Story Books' } }),
      prisma.category.findUniqueOrThrow({ where: { categoryName: 'Learning Kits' } }),
      prisma.category.findUniqueOrThrow({ where: { categoryName: 'Sensory Toys' } }),
    ]);

  const ageRangeMap = new Map<string, number>();
  const allAgeRanges = await prisma.ageRange.findMany();
  for (const ar of allAgeRanges) {
    ageRangeMap.set(`${ar.minAge}-${ar.maxAge}`, ar.id);
  }
  const ageInfant   = ageRangeMap.get('0-1')!;
  const ageToddler  = ageRangeMap.get('1-2')!;
  const agePreschool = ageRangeMap.get('3-4')!;
  const agePreK     = ageRangeMap.get('4-5')!;
  const ageKinder   = ageRangeMap.get('5-6')!;

  const IMAGE_PLACEHOLDER = 'https://placehold.co/400x400/e8f5e9/2e7d32.png?text=Artistryx';

  const products = [
    {
      sellerId: seller.id,
      name: 'Rainbow Crayon Set 24pc',
      description: 'Bright non-toxic wax crayons in 24 vibrant colors. Perfect for preschoolers developing fine motor skills and creativity.',
      imageUrl: IMAGE_PLACEHOLDER,
      price: 150.00,
      categoryId: coloringMaterials.id,
      ageRangeId: agePreschool,
      stockQuantity: 50,
    },
    {
      sellerId: seller.id,
      name: 'Washable Watercolor Paint Kit 18-Color',
      description: 'Washable, non-toxic watercolor paint set with 18 vivid colors and 2 brushes. Easy cleanup for mess-free fun.',
      imageUrl: IMAGE_PLACEHOLDER,
      price: 245.00,
      categoryId: coloringMaterials.id,
      ageRangeId: agePreK,
      stockQuantity: 35,
    },
    {
      sellerId: seller.id,
      name: 'Animals Coloring Book (32 pages)',
      description: 'Delightful animals-themed coloring book featuring 32 large, simple illustrations for young children.',
      imageUrl: IMAGE_PLACEHOLDER,
      price: 85.00,
      categoryId: coloringBooks.id,
      ageRangeId: agePreschool,
      stockQuantity: 100,
    },
    {
      sellerId: seller.id,
      name: 'Alphabet Foam Puzzle Mat (26 pieces)',
      description: 'Soft, non-toxic EVA foam alphabet puzzle tiles. Doubles as a play mat. Teaches letters A–Z through play.',
      imageUrl: IMAGE_PLACEHOLDER,
      price: 320.00,
      categoryId: puzzles.id,
      ageRangeId: ageToddler,
      stockQuantity: 25,
    },
    {
      sellerId: seller.id,
      name: 'Wooden Shape Sorter Puzzle',
      description: 'Classic chunky wooden puzzle with 8 basic shapes and matching cutouts. Develops shape recognition and hand-eye coordination.',
      imageUrl: IMAGE_PLACEHOLDER,
      price: 195.00,
      categoryId: puzzles.id,
      ageRangeId: ageToddler,
      stockQuantity: 20,
    },
    {
      sellerId: seller.id,
      name: 'Sensory Crinkle Toy Set (3-piece)',
      description: 'Soft fabric crinkle toys in bright colors to stimulate infant touch and hearing. BPA-free, machine washable.',
      imageUrl: IMAGE_PLACEHOLDER,
      price: 275.00,
      categoryId: sensoryToys.id,
      ageRangeId: ageInfant,
      stockQuantity: 40,
    },
    {
      sellerId: seller2.id,
      name: "The Little Gardener's Story Book",
      description: "A beautifully illustrated story about a young child learning to grow a garden. Encourages curiosity and love of nature.",
      imageUrl: IMAGE_PLACEHOLDER,
      price: 120.00,
      categoryId: storyBooks.id,
      ageRangeId: agePreschool,
      stockQuantity: 60,
    },
    {
      sellerId: seller2.id,
      name: 'My First ABCs Story Book',
      description: 'Interactive story book teaching the alphabet through a fun adventure. Each letter has its own character and short story.',
      imageUrl: IMAGE_PLACEHOLDER,
      price: 145.00,
      categoryId: storyBooks.id,
      ageRangeId: ageToddler,
      stockQuantity: 75,
    },
    {
      sellerId: seller2.id,
      name: 'Kindergarten Readiness Learning Kit',
      description: 'Comprehensive kit for kindergarten readiness: includes worksheets, flash cards, number tiles, and a parent guide.',
      imageUrl: IMAGE_PLACEHOLDER,
      price: 580.00,
      categoryId: learningKits.id,
      ageRangeId: ageKinder,
      stockQuantity: 15,
    },
    {
      sellerId: seller2.id,
      name: 'Pre-K Number & Counting Activity Kit',
      description: 'Hands-on activity kit featuring number puzzles, counting beads, and activity cards for children ages 4–5.',
      imageUrl: IMAGE_PLACEHOLDER,
      price: 420.00,
      categoryId: learningKits.id,
      ageRangeId: agePreK,
      stockQuantity: 20,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sellerId_name: { sellerId: product.sellerId, name: product.name } },
      update: {},
      create: { ...product, status: 'Available' },
    });
  }
  console.log(`Products seeded: ${products.length} items across 2 shops.`);
}

/**
 * Creates one completed order for the test customer, enabling the orders list
 * and order detail pages to show real data in E2E tests.
 */
async function seedTestOrder(): Promise<void> {
  const customer = await prisma.user.findUniqueOrThrow({
    where: { email: 'testcustomer@artistryx.test' },
    include: { userAddresses: true },
  });

  const product = await prisma.product.findFirst({
    where: { name: 'Rainbow Crayon Set 24pc' },
  });

  if (!product) {
    console.warn('Skipping order seed — products not found.');
    return;
  }

  const existingOrder = await prisma.order.findFirst({
    where: { userId: customer.id },
  });

  if (existingOrder) {
    console.log('Test order already exists — skipping.');
    return;
  }

  const userAddressId = customer.userAddresses[0]?.id ?? null;
  const itemPrice = product.price;
  const shippingFee = 58;

  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      userAddressId,
      totalAmount: Number(itemPrice) + shippingFee,
      shippingFee,
      orderStatus: 'Completed',
      orderItems: {
        create: {
          productId: product.id,
          quantity: 1,
          price: itemPrice,
          orderItemStatus: 'Completed',
          dateDelivered: new Date(),
        },
      },
      payment: {
        create: {
          paymentStatus: 'Paid',
          paymentAmount: Number(itemPrice) + shippingFee,
          paymentDate: new Date(),
        },
      },
    },
  });

  console.log(`Test order #${order.id} seeded for testcustomer.`);
}

main()
  .catch((error: Error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
