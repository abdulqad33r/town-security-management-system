import { createRoute as route } from "@hono/zod-openapi"

import { HttpStatus } from "@/constants/httpStatus"
import { PERMISSIONS } from "@/constants/permissions"
import { getMeSchema } from "@/db/schema"
import { jsonContentRequired, jsonContentWithData } from "@/lib/openapi"
import { idParamsSchema } from "@/lib/openapi/schemas"
import {
  errorResponse,
  notFoundErrorResponse,
  validationErrorResponse,
} from "@/lib/openapi/schemas/responseSchemas"
import { requireAuth, requirePermission } from "@/middlewares"
import {
  getAccountSchema,
  listAccountsQuerySchema,
  listAccountsSchema,
  nonPendingApprovalStatusSchema,
  updateApprovalStatusSchema,
} from "@/validators/accounts.validators"

const tags = ["accounts"] as const satisfies string[]

const approveAccess = [
  requireAuth,
  requirePermission(PERMISSIONS.ACCOUNT_APPROVE),
]

const readAccess = [
  requireAuth,
  requirePermission(PERMISSIONS.ACCOUNT_MANAGE_ANY),
]

export const updateAccountStatus = route({
  path: "/{id}/status",
  method: "patch",
  tags,
  middleware: approveAccess,
  request: {
    params: idParamsSchema,
    body: jsonContentRequired(
      updateApprovalStatusSchema,
      "New approval status"
    ),
  },
  responses: {
    [HttpStatus.OK]: jsonContentWithData(
      getMeSchema.extend({ approvalStatus: nonPendingApprovalStatusSchema }),
      "Account status updated"
    ),

    ...errorResponse(HttpStatus.BAD_REQUEST, "Invalid status transition"),
    ...notFoundErrorResponse("Account not found"),
    ...validationErrorResponse([idParamsSchema, updateApprovalStatusSchema]),
  },
})

export const getAccount = route({
  path: "/{id}",
  method: "get",
  tags,
  middleware: readAccess,
  request: { params: idParamsSchema },
  responses: {
    [HttpStatus.OK]: jsonContentWithData(getAccountSchema, "Account found"),

    ...notFoundErrorResponse("Account not found"),
    ...validationErrorResponse([idParamsSchema]),
  },
})

export const listAccounts = route({
  path: "/",
  method: "get",
  tags,
  middleware: readAccess,
  request: { query: listAccountsQuerySchema },
  responses: {
    [HttpStatus.OK]: jsonContentWithData(
      listAccountsSchema,
      "Query to list accounts finished"
    ),

    ...validationErrorResponse([listAccountsQuerySchema]),
  },
})

export type UpdateAccountStatusRoute = typeof updateAccountStatus
export type GetAccountRoute = typeof getAccount
export type ListAccounts = typeof listAccounts
