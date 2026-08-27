import type z from "zod"

import type { accountsTable, createAccountSchema } from "@/db/schema"
import type { FinalApprovalStatus } from "@/db/schema/enums"

import type { Prettify } from "."

export type Account = typeof accountsTable.$inferSelect

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type CreatedAccount = Prettify<
  Omit<Account, "role" | "approvalStatus"> & {
    role: CreateAccountInput["role"]
    approvalStatus: Extract<Account["approvalStatus"], "pending">
  }
>

export type UpdatedAccount = Prettify<
  Omit<Account, "approvalStatus"> & {
    approvalStatus: FinalApprovalStatus
  }
>

export type DeviceMeta = {
  ip: string
  userAgent: string
}
