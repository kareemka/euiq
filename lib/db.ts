import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString:
        process.env.DATABASE_URL ??
        "postgres://USER:PASSWORD@HOST:5432/DATABASE?schema=public",
    }),
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
