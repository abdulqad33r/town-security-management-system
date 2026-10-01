import { createRoute as route } from "@hono/zod-openapi"

import { HttpStatus } from "@/constants/httpStatus"
import {
  getMeSchema,
  nonPendingApprovalStatusSchema,
  updateApprovalStatusSchema,
} from "@/db/schema"
import { jsonContentRequired, jsonContentWithData } from "@/lib/openapi"
import { idParamsSchema } from "@/lib/openapi/schemas"
import {
  errorResponse,
  notFoundErrorResponse,
  validationErrorResponse,
} from "@/lib/openapi/schemas/responseSchemas"

const tags = ["accounts"] as const satisfies string[]

export const updateAccountStatus = route({
  path: "/{id}/status",
  method: "patch",
  tags,
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
    ...validationErrorResponse([updateApprovalStatusSchema]),
  },
})

export type UpdateAccountStatusRoute = typeof updateAccountStatus
