import 'dotenv/config';
import { PrismaClient, RoleName, UserStatus, ShopStatus, ProductStatus, AddressType, OrderStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { cities, barangays } from './locations';

const prisma = new PrismaClient({
  log: ['info', 'query', 'warn', 'error'],
});

async function main() {
  console.log('Starting seed...');

  // Clear existing data in correct order
  console.log('Clearing old data...');
  await prisma.review.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productDetail.deleteMany();
  await prisma.product.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.ageRange.deleteMany();
  await prisma.address.deleteMany();
  await prisma.barangay.deleteMany();
  await prisma.city.deleteMany();
  await prisma.province.deleteMany();

  // Roles
  const roleAdmin = await prisma.role.upsert({
    where: { roleName: RoleName.Admin },
    update: {},
    create: { roleName: RoleName.Admin }
  });
  const roleCustomer = await prisma.role.upsert({
    where: { roleName: RoleName.Customer },
    update: {},
    create: { roleName: RoleName.Customer }
  });
  const roleSeller = await prisma.role.upsert({
    where: { roleName: RoleName.Seller },
    update: {},
    create: { roleName: RoleName.Seller }
  });

  // 1. Age Ranges (Exactly 3)
  const age02 = await prisma.ageRange.create({ data: { minAge: 0, maxAge: 2, label: '0–2 Years' } });
  const age35 = await prisma.ageRange.create({ data: { minAge: 3, maxAge: 5, label: '3–5 Years' } });
  const age6plus = await prisma.ageRange.create({ data: { minAge: 6, maxAge: null, label: '6+ Years' } });

  // 2. Categories — Figma-accurate names & images
  const catCharts = await prisma.category.create({ data: { categoryName: 'Charts', description: 'Colorful charts to make learning visual and fun', imageUrl: '/Flash Cards.png' } });
  const catBooks = await prisma.category.create({ data: { categoryName: 'Books', description: 'Interactive and educational children\'s books', imageUrl: '/Books.png' } });
  const catBoardGames = await prisma.category.create({ data: { categoryName: 'Board Games', description: 'Fun board games that teach while you play', imageUrl: '/Board Games.png' } });
  const catFlashCards = await prisma.category.create({ data: { categoryName: 'Flash Cards', description: 'Educational flashcards for all ages', imageUrl: '/Flash Cards.png' } });
  const catSensoryToys = await prisma.category.create({ data: { categoryName: 'Sensory Toys', description: 'Hands-on sensory toys for tactile learning', imageUrl: '/Sensory Toys.png' } });

  // 3. Mock Account Passwords
  const seedPassword = process.env.SEED_PASSWORD || 'change-this-random-string';
  const adminPassword = process.env.ADMIN_PASSWORD || seedPassword;
  
  if (!process.env.SEED_PASSWORD) {
    console.warn('⚠️  WARNING: SEED_PASSWORD is not set. Using a temporary insecure password for mock accounts.');
  }

  const hashedDefaultPassword = await bcrypt.hash(seedPassword, 10);
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const stores = [
    { name: 'Giggling', first: 'Jillian Casey', last: 'Bandola', user: 'jillian_seller', email: 'jillian@giggling.test', logo: '/giggling.png', desc: 'Where every toy tells a story of joy and discovery. We specialize in sensory and imaginative play for the little ones.' },
    { name: 'Kidos', first: 'Angel', last: 'Orillana', user: 'angel_seller', email: 'angel@kidos.test', logo: '/kidos.png', desc: 'Premium educational books and interactive toys for growing minds.' },
    { name: 'Playbook', first: 'Clarissa', last: 'Avila', user: 'clarissa_seller', email: 'clarissa@playbook.test', logo: '/playbook.png', desc: 'Interactive charts and educational materials to make learning fun and visual.' },
    { name: 'Larana', first: 'Zsanpeter', last: 'Serra', user: 'zsanpeter_seller', email: 'zsanpeter@larana.test', logo: '/larana.png', desc: 'Crafting wooden sensory toys and flash cards that spark curiosity and fine motor skills.' },
    { name: 'Wonders', first: 'Allen', last: 'Capitulo', user: 'allen_seller', email: 'allen@wonders.test', logo: '/wonders.png', desc: 'Whimsical toys and pop-up books that bring wonder into your child\'s world.' },
  ];

  const sellerIds: number[] = [];
  for (const s of stores) {
    const userResult = await prisma.user.create({
      data: {
        firstName: s.first,
        lastName: s.last,
        username: s.user,
        email: s.email,
        password: hashedDefaultPassword,
        dateOfBirth: new Date('1990-01-01'),
        contactNumber: '09123456789',
        status: UserStatus.Active,
      }
    });

    await prisma.userRole.create({
      data: { userId: userResult.id, roleId: roleSeller.id }
    });

    // Create cart for seller so they can also shop
    await prisma.cart.create({ data: { userId: userResult.id } });

    const sellerResult = await prisma.seller.create({
      data: {
        userId: userResult.id,
        shopName: s.name,
        shopDescription: s.desc,
        shopStatus: ShopStatus.Active,
        shopLogoUrl: s.logo,
      }
    });
    sellerIds.push(sellerResult.id);
  }

  // 4. Products Data (with high-fidelity Figma descriptions)
  const productsData = [
    {
      name: '44 Sounds Flashcards',
      price: 349.00,
      cat: catFlashCards.id,
      age: age6plus.id,
      img: '/44soundsflashcards.png',
      seller: sellerIds[3],
      desc: 'Master the core sounds of the English language! These 44 Sounds Flashcards are designed for school-aged children to build a strong foundation in phonics and reading clarity.'
    },
    {
      name: '50 First Phonics Sound Book',
      price: 599.00,
      cat: catBooks.id,
      age: age35.id,
      img: '/50firstphonicssoundbook.png',
      seller: sellerIds[2],
      desc: 'An interactive sound book that introduces the first 50 phonics sounds. Perfect for toddlers and preschoolers beginning their reading journey with engaging audio feedback.'
    },
    {
      name: 'Alphabet Chart',
      price: 149.00,
      cat: catCharts.id,
      age: age02.id,
      img: '/alphabetchart.png',
      seller: sellerIds[3],
      desc: 'Start your child\'s literacy journey with the Playbook Alphabet Chart! This vibrant wall chart is the perfect way to introduce the ABCs through fun, recognizable illustrations.'
    },
    {
      name: 'Alphabet Creative Puzzle',
      price: 399.00,
      cat: catSensoryToys.id,
      age: age35.id,
      img: '/alphabetcreativepuzzle.png',
      seller: sellerIds[1],
      desc: 'A creative wooden puzzle that combines letter recognition with spatial problem-solving. Each letter fits perfectly into its slot, teaching children both the alphabet and fine motor control.'
    },
    {
      name: 'Animal Color Classification',
      price: 349.00,
      cat: catSensoryToys.id,
      age: age02.id,
      img: '/animalcolorclassification.png',
      seller: sellerIds[1],
      desc: 'Teach your toddler to sort and classify the world! This colorful toy helps children recognize animals and colors while developing early logic and sorting skills.'
    },
    {
      name: 'Basic Body Parts Chart',
      price: 149.00,
      cat: catCharts.id,
      age: age02.id,
      img: '/basicbodypartschart.png',
      seller: sellerIds[3],
      desc: 'A simple and clear visual guide to help toddlers learn the basics of the human body. Large, friendly illustrations make identifying parts easy and fun.'
    },
    {
      name: 'Beep Honk Zoom Sound Book',
      price: 299.00,
      cat: catBooks.id,
      age: age02.id,
      img: '/beephonkzoomsoundbook.png',
      seller: sellerIds[2],
      desc: 'The Beep! Honk! Zoom! Slide and Sound Book is an interactive and engaging children\'s book designed to make learning fun with built-in sound buttons for vehicle sounds.'
    },
    {
      name: 'Busy Board with Emergency Echo',
      price: 349.00,
      cat: catSensoryToys.id,
      age: age02.id,
      img: '/busyboardwithemergencyecho.png',
      seller: sellerIds[0],
      desc: 'Spark your toddlers curiosity with the Larana Busy Board, a car-shaped wooden toy with real-world switches and buttons for hands-on sensory play.'
    },
    {
      name: 'Dinosaurs Pop-Up Book',
      price: 349.00,
      cat: catBooks.id,
      age: age35.id,
      img: '/dinosaurspop-up.png',
      seller: sellerIds[4],
      desc: 'Roar into reading! This pop-up book brings prehistoric giants to life in 3D. A magical experience for any dinosaur-loving child aged 3 to 5.'
    },
    {
      name: 'Fruits Flashcards',
      price: 199.00,
      cat: catFlashCards.id,
      age: age02.id,
      img: '/fruitsflashcards.png',
      seller: sellerIds[3],
      desc: 'Introduce your child to the vibrant world of nutrition with the Larana Fruits Flash Cards, featuring 25 illustrated cards with high-quality images.'
    },
    {
      name: 'Fun with Opposites',
      price: 399.00,
      cat: catBooks.id,
      age: age35.id,
      img: '/funwithopposites.png',
      seller: sellerIds[2],
      desc: 'An educational book that explores common opposites like Big/Small and Up/Down through playful illustrations and interactive elements.'
    },
    {
      name: 'Geometric Shape Matching Blocks',
      price: 359.00,
      cat: catSensoryToys.id,
      age: age02.id,
      img: '/geometricshapematchingblocks.png',
      seller: sellerIds[0],
      desc: 'The Geometric Shape Matching Blocks is an educational toy with a sturdy base and colorful blocks that enhance shape recognition and motor skills.'
    },
    {
      name: 'Math Fun Addition',
      price: 299.00,
      cat: catBoardGames.id,
      age: age6plus.id,
      img: '/mathfunaddition.png',
      seller: sellerIds[2],
      desc: 'Master the basics of arithmetic! Maths Fun: Addition is an engaging board game designed to transform math practice into an interactive adventure.'
    },
    {
      name: 'Numbers 1-10 Chart',
      price: 149.00,
      cat: catCharts.id,
      age: age35.id,
      img: '/numbers1-10chart.png',
      seller: sellerIds[3],
      desc: 'Make learning numbers as easy as 1-2-3! This Numbers 1-10 Chart is a vibrant tool designed to help preschoolers master early numeracy.'
    },
    {
      name: 'Numbers Flashcards',
      price: 249.00,
      cat: catFlashCards.id,
      age: age35.id,
      img: '/numbersflashcards.png',
      seller: sellerIds[3],
      desc: 'High-quality flash cards for learning numbers and basic counting. Perfect for home practice and classroom activities for children aged 3 and up.'
    },
    {
      name: 'Teddy\'s Color & Shapes',
      price: 269.00,
      cat: catSensoryToys.id,
      age: age35.id,
      img: '/teddyscolor&shapes.png',
      seller: sellerIds[1],
      desc: 'Follow Teddy as he learns about colors and shapes! An interactive learning toy that combines storytelling with early educational concepts.'
    },
  ];

  for (const p of productsData) {
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.desc,
        price: p.price,
        stockQuantity: 50,
        categoryId: p.cat,
        ageRangeId: p.age,
        sellerId: p.seller,
        status: ProductStatus.Available,
        imageUrl: p.img,
      }
    });
  }

  // 5. Locations (Provinces, Cities, Barangays)
  console.log('Seeding locations...');
  const provinceAlbay = await prisma.province.create({ data: { province: 'Albay' } });
  
  await prisma.city.createMany({
    data: cities.map(c => ({
      city: c.name,
      postalCode: c.postalCode,
      provinceId: provinceAlbay.id
    }))
  });
  
  const cityRecords = await prisma.city.findMany({ where: { provinceId: provinceAlbay.id } });
  
  await prisma.barangay.createMany({
    data: barangays.map(b => {
      const cityName = cities.find(c => c.id === b.cityId)!.name;
      const dbCity = cityRecords.find(c => c.city === cityName)!;
      return {
        barangay: b.name,
        cityId: dbCity.id
      };
    })
  });

  // 6. Build Complex Test Accounts
  console.log('Seeding more accounts...');

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'System',
      lastName: 'Admin',
      username: 'admin',
      email: 'admin@artistryx.test',
      password: hashedAdminPassword,
      dateOfBirth: new Date('1985-12-25'),
      contactNumber: '09000000001',
      status: UserStatus.Active,
    }
  });
  await prisma.userRole.create({ data: { userId: adminUser.id, roleId: roleAdmin.id } });
  // Cart for admin so they can test buying flow
  await prisma.cart.create({ data: { userId: adminUser.id } });

  // Multiple Customers
  const customerNames = [
    { first: 'Kristine Mae', last: 'Bataller', user: 'kristine_customer', email: 'kristine@example.test' },
    { first: 'Rhona Eloisa', last: 'Lumbes', user: 'rhona_customer', email: 'rhona@example.test' },
    { first: 'Jane', last: 'Smith', user: 'jane_customer', email: 'jane@example.test' },
  ];

  for (const c of customerNames) {
    const u = await prisma.user.create({
      data: {
        firstName: c.first,
        lastName: c.last,
        username: c.user,
        email: c.email,
        password: hashedDefaultPassword,
        dateOfBirth: new Date('1995-05-05'),
        contactNumber: '09876543210',
        status: UserStatus.Active,
      }
    });
    await prisma.userRole.create({ data: { userId: u.id, roleId: roleCustomer.id } });
    // Cart for customer
    await prisma.cart.create({ data: { userId: u.id } });
  }

  // Seller with no store/pending store
  const sellerPending = await prisma.user.create({
    data: {
      firstName: 'Hopeful',
      lastName: 'Merchant',
      username: 'pending_seller',
      email: 'pending@seller.test',
      password: hashedDefaultPassword,
      dateOfBirth: new Date('1992-02-02'),
      contactNumber: '09112223334',
      status: UserStatus.Active,
    }
  });
  await prisma.userRole.create({ data: { userId: sellerPending.id, roleId: roleSeller.id } });
  // Cart for pending seller
  await prisma.cart.create({ data: { userId: sellerPending.id } });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
