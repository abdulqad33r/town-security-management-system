import { eq } from "drizzle-orm"

import db from "@/db"
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
