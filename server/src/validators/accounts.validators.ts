import z from "zod"

import { accountsSchema } from "@/db/schema"

export const nonPendingApprovalStatusSchema =
  accountsSchema.shape.approvalStatus.exclude(["pending"])

export const updateApprovalStatusSchema = z.object({
  approvalStatus: nonPendingApprovalStatusSchema,
})

export const listAccountsSchema = accountsSchema
  .pick({ approvalStatus: true, role: true })
  .extend({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().max(100).default(20),
  })

export const getAccountSchema = accountsSchema.omit({ passwordHash: true })
