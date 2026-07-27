import { z } from "@hono/zod-openapi"
import type { ZodType } from "zod"

import { ERROR_TYPES } from "@/utils/constants"
import { HttpStatus } from "@/utils/constants/httpStatus"

import createZodErrorResponseSchema from "../factories/createZodErrorResponseSchema"
import jsonContent from "../helpers/jsonContent"

const commonErrorResponseSchema = z.object({
  success: z.literal(false),
  type: z
    .enum(ERROR_TYPES)
    .openapi({ example: ERROR_TYPES.VALIDATION_ERROR }),
  message: z.string().openapi({ example: "Not Found" }),
  stack: z.string().optional().openapi({
    example:
      "Error at createUserHandler (...\\src\\routes\\users\\users.handlers.ts:50:3)",
  }),
})

export const notFoundErrorResponse = (description: string) => ({
  [HttpStatus.NOT_FOUND]: jsonContent(
    commonErrorResponseSchema.extend({
      type: z
        .literal(ERROR_TYPES.NOT_FOUND)
        .openapi({ example: ERROR_TYPES.NOT_FOUND }),
    }),
    description
  ),
})

export const validationErrorResponse = <T extends ZodType>(
  schemas: readonly T[],
  description: string
) => {
  const [first, ...rest] = schemas.map(schema =>
    createZodErrorResponseSchema(schema)
  )
  const errorSchema = rest.reduce<ZodType>(
    (acc, schema) => acc.or(schema),
    first
  )

  return {
    [HttpStatus.UNPROCESSABLE_ENTITY]: jsonContent(
      errorSchema as T,
      description
    ),
  }
}
