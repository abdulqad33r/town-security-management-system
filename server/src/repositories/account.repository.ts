import { and, count, eq } from "drizzle-orm"

import db from "@/db"
import type { ApprovalStatus, UserRole } from "@/db/schema"
import { accountsTable } from "@/db/schema"
import type {
  CreateAccountInput,
  CreatedAccount,
  NonPendingApprovalStatus,
  UpdatedAccount,
} from "@/types/auth.types"

export const findAccountByEmail = (email: string) =>
  db.query.accountsTable.findFirst({ where: { email } })

export const findAccountById = (id: string) =>
  db.query.accountsTable.findFirst({ where: { id } })

export const createAccount = (data: CreateAccountInput) =>
  db
    .insert(accountsTable)
    .values({ ...data, approvalStatus: "pending" })
    .returning()
    .then(rows => rows[0] as CreatedAccount)

export const updateApprovalStatus = (
  id: string,
  approvalStatus: NonPendingApprovalStatus
): Promise<UpdatedAccount | undefined> =>
  db
    .update(accountsTable)
    .set({ approvalStatus })
    .where(eq(accountsTable.id, id))
    .returning()
    .then(rows => rows[0] as UpdatedAccount | undefined)

export async function findAccounts(
  {
    approvalStatus,
    role,
  }: { approvalStatus?: ApprovalStatus; role?: UserRole },
  { offset, limit }: { offset: number; limit: number }
) {
  const where = {
    ...(approvalStatus ? { approvalStatus } : {}),
    ...(role ? { role } : {}),
  }

  const conditions = [
    approvalStatus
      ? eq(accountsTable.approvalStatus, approvalStatus)
      : undefined,
    role ? eq(accountsTable.role, role) : undefined,
  ]

  const [accounts, total] = await Promise.all([
    db.query.accountsTable.findMany({
      where,
      offset,
      limit,
      orderBy: { createdAt: "desc", id: "asc" },
      columns: { passwordHash: false },
    }),

    db
      .select({ total: count() })
      .from(accountsTable)
      .where(and(...conditions))
      .then(rows => rows[0].total),
  ])

  return { accounts, total }
}
