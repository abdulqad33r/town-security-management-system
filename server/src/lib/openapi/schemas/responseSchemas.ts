import type { ZodType } from "zod"

import { HttpErrorStatusByCode } from "@/constants/errorTypes"
import type { HttpErrorStatusCode } from "@/constants/httpStatus"
import { HttpStatus } from "@/constants/httpStatus"

import createErrorResponseSchema from "../factories/createErrorResponseSchema"
import createZodErrorResponseSchema from "../factories/createZodErrorResponseSchema"
import jsonContent from "../helpers/jsonContent"

// const commonErrorResponseSchema = z.object({
//   success: z.literal(false),
//   type: z.enum(ERROR_TYPES).openapi({ example: ERROR_TYPES.VALIDATION_ERROR }),
//   message: z.string().openapi({ example: "Not Found" }),
//   stack: z.string().optional().openapi({
//     example:
//       "Error at createUserHandler (...\\src\\routes\\users\\users.handlers.ts:50:3)",
//   }),
// })

export const errorResponse = <S extends HttpErrorStatusCode>(
  status: S,
  exampleMessage: string,
  description = exampleMessage
) => {
  const response = jsonContent(
    createErrorResponseSchema(HttpErrorStatusByCode[status], exampleMessage),
    description
  )

  return {
    [status]: response,
  } as { [K in S]: typeof response }
}

export const notFoundErrorResponse = (description: string) =>
  errorResponse(HttpStatus.NOT_FOUND, "Not Found", description)

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
