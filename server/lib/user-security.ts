import { prisma } from "./prisma.js";

type TwoFactorRow = { twoFactorEnabled: boolean };

function isMissingSecurityTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; meta?: { code?: string; message?: string } };
  return err.code === "42P01" || err.meta?.code === "42P01";
}

export async function getTwoFactorEnabledForUser(userId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<TwoFactorRow[]>`
      SELECT "twoFactorEnabled"
      FROM "UserSecuritySetting"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    return rows[0]?.twoFactorEnabled ?? false;
  } catch (error) {
    if (isMissingSecurityTableError(error)) return false;
    throw error;
  }
}

export async function setTwoFactorEnabledForUser(userId: string, enabled: boolean): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO "UserSecuritySetting" ("userId", "twoFactorEnabled", "updatedAt")
      VALUES (${userId}, ${enabled}, NOW())
      ON CONFLICT ("userId")
      DO UPDATE SET "twoFactorEnabled" = EXCLUDED."twoFactorEnabled", "updatedAt" = NOW()
    `;
  } catch (error) {
    if (isMissingSecurityTableError(error)) {
      throw new Error("Security settings table is missing. Run the latest Prisma migration.");
    }
    throw error;
  }
}
