import db from "@/db"
import { accountsTable } from "@/db/schema"
import { hashPassword } from "@/services/password.service"

export const resetDb = async () => {
  await db.execute("TRUNCATE TABLE accounts RESTART IDENTITY CASCADE")
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
