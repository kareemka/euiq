import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/auction?schema=public",
  }),
});

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@Secure123456";
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await db.admin.upsert({
    where: { email },
    update: { passwordHash, active: true },
    create: { email, passwordHash, role: "SUPERADMIN" },
  });
  console.log(`✓ Admin ready: ${email}`);

  // Create sample users for realistic auction bids
  const sampleUsersData = [
    { name: "حيدر البغدادي", phone: "07701234567" },
    { name: "علي الموسوي", phone: "07802345678" },
    { name: "عمر السامرائي", phone: "07503456789" },
    { name: "سجاد الكرخي", phone: "07714567890" },
    { name: "محمد المنصوري", phone: "07815678901" },
  ];

  const sampleUsers = [];
  for (const u of sampleUsersData) {
    const user = await db.auctionUser.upsert({
      where: { phone: u.phone },
      update: { name: u.name },
      create: { name: u.name, phone: u.phone },
    });
    sampleUsers.push(user);
  }
  console.log(`✓ Sample bidders ready: ${sampleUsers.length} users`);

  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;

  // 16 rich auction products
  const productsData = [
    {
      name: "عطر ديور سوفاج أو دو بارفان 100 ملم",
      description: "عطر رجالي فرنسي أصلي فاخر برائحة البرغموت والفانيلا مع ثباتية تدوم طويلاً.",
      imageUrl: "/images/02_luxury_perfume.jpg",
      openingPrice: 45000,
      currentPrice: 45000,
      bidIncrement: 2500,
      startsAt: new Date(now - 30 * minute),
      endsAt: new Date(now + 3 * hour),
      active: true,
    },
    {
      name: "ساعة رولكس كلاسيك ديت جست أوتوماتيك",
      description: "ساعة سويسرية كلاسيكية فاخرة بإطار ستيل مذهب ومينا مميز مقاوم للماء والخدش.",
      imageUrl: "/images/06_luxury_watch.jpg",
      openingPrice: 120000,
      currentPrice: 120000,
      bidIncrement: 5000,
      startsAt: new Date(now - 15 * minute),
      endsAt: new Date(now + 2 * hour),
      active: true,
    },
    {
      name: "طقم دهن عود وبخور كمبودي ملكي معتق",
      description: "بخور كمبودي طبيعي درجة أولى مع تولة دهن عود معتقة برائحة بخورية شرقية فاخرة.",
      imageUrl: "/images/08_luxury_oud_set.jpg",
      openingPrice: 35000,
      currentPrice: 35000,
      bidIncrement: 2000,
      startsAt: new Date(now - 20 * minute),
      endsAt: new Date(now + 4 * hour),
      active: true,
    },
    {
      name: "طقم أساور ذهبية مرصعة بالزركون النقي",
      description: "تصميم أنيق مستوحى من دور المجوهرات العالمية، مطلي بالذهب عيار 18 مع قفل محكم.",
      imageUrl: "/images/04_luxury_bracelet.jpg",
      openingPrice: 28000,
      currentPrice: 28000,
      bidIncrement: 1500,
      startsAt: new Date(now - 10 * minute),
      endsAt: new Date(now + 5 * hour),
      active: true,
    },
    {
      name: "مبخرة ملكية من الكريستال والنحاس الذهبي",
      description: "تحفة فنية بتفاصيل يدوية ونقوش إسلامية مذهبة تناسب مجالس الضيافة الراقية.",
      imageUrl: "/images/05_incense_burner.jpg",
      openingPrice: 22000,
      currentPrice: 22000,
      bidIncrement: 1000,
      startsAt: new Date(now - 45 * minute),
      endsAt: new Date(now + 1.5 * hour),
      active: true,
    },
    {
      name: "سماعات آبل إيربودز برو الجيل الثاني",
      description: "سماعات بلوتوث مع ميزة إلغاء الضوضاء النشطة، صوت مكاني مخصص، وعلبة شحن MagSafe.",
      imageUrl: "/images/07_wireless_earbuds.jpg",
      openingPrice: 65000,
      currentPrice: 65000,
      bidIncrement: 2500,
      startsAt: new Date(now - 50 * minute),
      endsAt: new Date(now + 6 * hour),
      active: true,
    },
    {
      name: "طقم إكسسوارات رجالية فاخرة (قلم وكبك ومسبحة)",
      description: "طقم هدايا رجالي ملكي يشمل قلم حبر جاف أنيق مع كبك مذهب ومسبحة حجر عقيق طبيعي.",
      imageUrl: "/images/09_luxury_accessories.jpg",
      openingPrice: 30000,
      currentPrice: 30000,
      bidIncrement: 2000,
      startsAt: new Date(now - 1 * hour),
      endsAt: new Date(now + 8 * hour),
      active: true,
    },
    {
      name: "حقيبة نسائية إيطالية جلد طبيعي فاخر",
      description: "حقيبة يد راقية باللون الوردي الملكي مع سلسلة معدنية ذهبية ومحفظة متناسقة.",
      imageUrl: "/images/03_pink_product.jpg",
      openingPrice: 40000,
      currentPrice: 40000,
      bidIncrement: 2000,
      startsAt: new Date(now - 2 * hour),
      endsAt: new Date(now + 7 * hour),
      active: true,
    },
    {
      name: "مطرقة مزاد تاريخية نحاسية مذهبة بقاعدة خشبية",
      description: "تحفة مقتنيات أصلية من النحاس الخالص المذهب بقاعدة من خشب الجوز الفاخر لهواة التحف.",
      imageUrl: "/images/01_auction_gavel.jpg",
      openingPrice: 50000,
      currentPrice: 50000,
      bidIncrement: 5000,
      startsAt: new Date(now - 10 * minute),
      endsAt: new Date(now + 12 * hour),
      active: true,
    },
    {
      name: "عطر روجا إليزيم بور أوم نيش سويسري",
      description: "عطر أرستقراطي حصري من دار روجا دوف البريطانية بنوتات الحمضيات والأخشاب النادرة.",
      imageUrl: "/images/02_luxury_perfume.jpg",
      openingPrice: 85000,
      currentPrice: 85000,
      bidIncrement: 5000,
      startsAt: new Date(now - 15 * minute),
      endsAt: new Date(now + 9 * hour),
      active: true,
    },
    {
      name: "ساعة يد أوميغا سيماستر دايفر 300M",
      description: "ساعة رياضية فاخرة بمينا سيراميك أزرق مع سوار ستانلس ستيل وصمام هروب الهيليوم.",
      imageUrl: "/images/06_luxury_watch.jpg",
      openingPrice: 95000,
      currentPrice: 95000,
      bidIncrement: 5000,
      startsAt: new Date(now - 30 * minute),
      endsAt: new Date(now + 10 * hour),
      active: true,
    },
    {
      name: "سوار كارتييه لوف مطلي بالذهب الوردي عيار 18",
      description: "سوار أيقوني فاخر بنظام إغلاق برغي خاص مع علبة كارتييه الأصلية وشهادة الضمان.",
      imageUrl: "/images/04_luxury_bracelet.jpg",
      openingPrice: 38000,
      currentPrice: 38000,
      bidIncrement: 2000,
      startsAt: new Date(now - 1 * hour),
      endsAt: new Date(now + 14 * hour),
      active: true,
    },
    {
      name: "طقم عطور شرقية ومخلط ملكي فاخر (3 زجاجات)",
      description: "تشكيلة مختارة من أرقى الزيوت العطرية بدهن العود والعنبر والمسك الأبيض الصافي.",
      imageUrl: "/images/08_luxury_oud_set.jpg",
      openingPrice: 55000,
      currentPrice: 55000,
      bidIncrement: 2500,
      startsAt: new Date(now - 2 * hour),
      endsAt: new Date(now + 11 * hour),
      active: true,
    },
    {
      name: "مسبحة كهرمان بلطيقي حر لون عسلي شفاف 33 حبة",
      description: "مسبحة نادرة من الكهرمان الطبيعي المعتق بصوت رنان ورائحة صنوبرية مميزة عند الفرك.",
      imageUrl: "/images/09_luxury_accessories.jpg",
      openingPrice: 70000,
      currentPrice: 70000,
      bidIncrement: 5000,
      startsAt: new Date(now - 20 * minute),
      endsAt: new Date(now + 16 * hour),
      active: true,
    },
    {
      name: "طقم ضيافة ومباخر تراثية فضية منقوشة",
      description: "صينية فضية مع مبخرة ومرش عطر بتصميم بغدادي عريق مطعم بالنقوش اليدوية البارزة.",
      imageUrl: "/images/05_incense_burner.jpg",
      openingPrice: 32000,
      currentPrice: 32000,
      bidIncrement: 1500,
      startsAt: new Date(now - 10 * minute),
      endsAt: new Date(now + 18 * hour),
      active: true,
    },
    {
      name: "سماعات سوني WH-1000XM5 عازلة للضوضاء",
      description: "سماعة رأس لاسلكية احترافية بجودة صوت استوديو ودعم بطارية تدوم حتى 30 ساعة متواصلة.",
      imageUrl: "/images/07_wireless_earbuds.jpg",
      openingPrice: 60000,
      currentPrice: 60000,
      bidIncrement: 3000,
      startsAt: new Date(now - 40 * minute),
      endsAt: new Date(now + 20 * hour),
      active: true,
    },
  ];

  // Insert or update products
  console.log(`Seeding ${productsData.length} auction items...`);
  for (let i = 0; i < productsData.length; i++) {
    const item = productsData[i];
    const existing = await db.product.findFirst({ where: { name: item.name } });
    let product;
    if (existing) {
      product = await db.product.update({
        where: { id: existing.id },
        data: item,
      });
    } else {
      product = await db.product.create({ data: item });
    }

    // Add 1-3 sample bids on the first 10 items for realistic activity
    if (i < 10) {
      const bidsCount = (i % 3) + 1; // 1 to 3 bids
      let currentPrice = product.openingPrice;

      for (let b = 0; b < bidsCount; b++) {
        const bidder = sampleUsers[b % sampleUsers.length];
        currentPrice += product.bidIncrement;

        // Check if bid exists or create one
        const existingBid = await db.bid.findFirst({
          where: { productId: product.id, amount: currentPrice },
        });

        if (!existingBid) {
          await db.bid.create({
            data: {
              productId: product.id,
              userId: bidder.id,
              amount: currentPrice,
              createdAt: new Date(now - (30 - b * 5) * minute),
            },
          });
        }
      }

      // Update product currentPrice to match highest bid
      await db.product.update({
        where: { id: product.id },
        data: { currentPrice },
      });
    }
  }

  const finalCount = await db.product.count();
  const bidsTotal = await db.bid.count();
  console.log(`✓ Database successfully seeded! Total products: ${finalCount}, Total bids: ${bidsTotal}`);
}

main().finally(() => db.$disconnect());
