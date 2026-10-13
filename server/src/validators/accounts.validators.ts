import { z } from "@hono/zod-openapi"

import { accountsSchema } from "@/db/schema"

export const nonPendingApprovalStatusSchema =
  accountsSchema.shape.approvalStatus.exclude(["pending"])

export const updateApprovalStatusSchema = z.object({
  approvalStatus: nonPendingApprovalStatusSchema,
})

export const getAccountSchema = accountsSchema.omit({ passwordHash: true })

export const listAccountsQuerySchema = accountsSchema
  .pick({ approvalStatus: true, role: true })
  .partial()
  .extend({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().max(100).default(20),
  })
export type ListAccountsQuery = z.infer<typeof listAccountsQuerySchema>

export const listAccountsSchema = z.object({
  accounts: z.array(getAccountSchema),
  pagination: z.object({
    page: z.number().positive().openapi({ example: 1 }),
    limit: z.number().positive().openapi({ example: 20 }),
    total: z.number().positive().openapi({ example: 100 }),
    totalPages: z.number().positive().openapi({ example: 5 }),
  }),
})
export type ListAccountsResponse = z.infer<typeof listAccountsSchema>
