import { eq } from "drizzle-orm"

import db from "@/db"
import { accountsTable } from "@/db/schema"
import type { FinalApprovalStatus } from "@/db/schema/enums"
import type {
  CreateAccountInput,
  CreatedAccount,
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
  approvalStatus: FinalApprovalStatus
): Promise<UpdatedAccount | undefined> =>
  db
    .update(accountsTable)
    .set({ approvalStatus })
    .where(eq(accountsTable.id, id))
    .returning()
    .then(rows => rows[0] as UpdatedAccount | undefined)
