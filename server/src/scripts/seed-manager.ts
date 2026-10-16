import z from "zod"

import db from "@/db"
import { accountsTable } from "@/db/schema"
import { hashPassword } from "@/services/password.service"

// Validated here, not in config/env.ts: these must not be required for the API to boot
const inputSchema = z.object({
  MANAGER_EMAIL: z.email(),
  MANAGER_PASSWORD: z.string().min(12),
  MANAGER_FIRST_NAME: z.string().min(2).max(50).default("Town"),
  MANAGER_LAST_NAME: z.string().min(2).max(50).default("Manager"),
  MANAGER_PHONE: z.string().min(7).max(20).default("0000000000"),
})

async function main(): Promise<number> {
  const parsed = inputSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error("❌ Invalid manager seed configuration")
    console.error(z.treeifyError(parsed.error).properties)
    return 1
  }

  const input = parsed.data

  const existingManager = await db.query.accountsTable.findFirst({
    where: { role: "manager" },
  })
  if (existingManager) {
    console.error(
      `❌ A manager already exists (${existingManager.email}). Nothing was changed.`
    )
    return 1
  }

  const emailTaken = await db.query.accountsTable.findFirst({
    where: { email: input.MANAGER_EMAIL },
  })
  if (emailTaken) {
    console.error(
      "❌ That email is already registered to a non-manager account."
    )
    return 1
  }

  const [manager] = await db
    .insert(accountsTable)
    .values({
      role: "manager",
      email: input.MANAGER_EMAIL,
      firstName: input.MANAGER_FIRST_NAME,
      lastName: input.MANAGER_LAST_NAME,
      phone: input.MANAGER_PHONE,
      passwordHash: await hashPassword(input.MANAGER_PASSWORD),
      approvalStatus: "approved",
    })
    .returning({ id: accountsTable.id, email: accountsTable.email })

  console.log(`✅ Manager created: ${manager.email} (${manager.id})`)
  return 0
}

main()
  .then(code => process.exit(code))
  .catch(error => {
    console.error("❌ Seeding failed:", error)
    process.exit(1)
  })
