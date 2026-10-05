import z from "zod"

import { accountsSchema } from "@/db/schema"

export const nonPendingApprovalStatusSchema =
  accountsSchema.shape.approvalStatus.exclude(["pending"])

export const updateApprovalStatusSchema = z.object({
  approvalStatus: nonPendingApprovalStatusSchema,
})

export const getAccountSchema = accountsSchema.omit({ passwordHash: true })
