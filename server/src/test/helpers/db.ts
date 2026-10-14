import env from "@/config/env"
import db from "@/db"
import { accountsTable } from "@/db/schema"
import redis from "@/redis/client"
import { hashPassword } from "@/services/password.service"

export const resetDb = async () => {
  if (env.NODE_ENV !== "test")
    throw new Error("resetDb() is only allowed when NODE_ENV=test")

  await db.execute("TRUNCATE TABLE accounts RESTART IDENTITY CASCADE")
  await redis.send("FLUSHDB", [])
}

/** Seeds the one manager account directly, bypassing /auth/register (which excludes "manager"). */
export async function seedManager(password = "manager-password-123") {
  const [manager] = await db
    .insert(accountsTable)
    .values({
      role: "manager",
      firstName: "Town",
      lastName: "Manager",
      email: `manager-${crypto.randomUUID()}@example.com`,
      phone: "0000000000",
      passwordHash: await hashPassword(password),
      approvalStatus: "approved",
    })
    .returning()

  return { manager, password }
}

const TEST_PASSWORD = "account-password-123"
// Hashing once at import time. Argon2 is deliberately slow, and every seeded account can share it
const testPasswordHash = hashPassword(TEST_PASSWORD)

export async function seedAccount(
  overrides: Partial<typeof accountsTable.$inferInsert> = {}
) {
  const [account] = await db
    .insert(accountsTable)
    .values({
      role: "resident",
      firstName: "Test",
      lastName: "Account",
      email: `${crypto.randomUUID()}@example.com`,
      phone: "0000000000",
      passwordHash: await testPasswordHash,
      approvalStatus: "approved",
      ...overrides,
    })
    .returning()

  return { account, password: TEST_PASSWORD }
}
