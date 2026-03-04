-- Create table for per-user security preferences (2FA toggle)
CREATE TABLE "UserSecuritySetting" (
  "userId" TEXT NOT NULL,
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSecuritySetting_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserSecuritySetting"
  ADD CONSTRAINT "UserSecuritySetting_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
