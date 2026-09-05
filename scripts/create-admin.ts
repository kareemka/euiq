import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://USER:PASSWORD@HOST:5432/DATABASE?schema=public",
  }),
});

async function main() {
  const email = process.argv[2]?.toLowerCase();
  const password = process.argv[3];
  if (!email || !password || password.length < 12) {
    console.error(
      "Usage: npm run admin:create -- admin@example.com 'long-password-at-least-12'"
    );
    process.exit(1);
  }
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await db.admin.upsert({
    where: { email },
    update: { passwordHash, active: true },
    create: { email, passwordHash, role: "ADMIN" },
  });
  console.log("Admin ready:", email);
  await db.$disconnect();
}

main();
