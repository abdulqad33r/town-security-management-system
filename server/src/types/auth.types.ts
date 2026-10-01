import type z from "zod"

import type {
  accountsTable,
  createAccountSchema,
  nonPendingApprovalStatusSchema,
} from "@/db/schema"

import type { Prettify } from "."

export type Account = typeof accountsTable.$inferSelect

export type NonPendingApprovalStatus = z.infer<
  typeof nonPendingApprovalStatusSchema
>

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type CreatedAccount = Prettify<
  Omit<Account, "role" | "approvalStatus"> & {
    role: CreateAccountInput["role"]
    approvalStatus: Extract<Account["approvalStatus"], "pending">
  }
>

export type UpdatedAccount = Prettify<
  Omit<Account, "approvalStatus"> & {
    approvalStatus: NonPendingApprovalStatus
  }
>

export type DeviceMeta = {
  ip: string
  userAgent: string
}
