import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  // Add a sensible connection pool size if the URL doesn't specify one.
  const url = new URL(process.env.DATABASE_URL);
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", process.env.DB_CONNECTION_LIMIT || "10");
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "15");
  }

  return new PrismaClient({
    datasourceUrl: url.toString(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma;
}
