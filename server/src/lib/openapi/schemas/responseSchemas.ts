import type { ZodType } from "zod"

import { HttpErrorStatusByCode } from "@/constants/errorTypes"
import type { HttpErrorStatusCode } from "@/constants/httpStatus"
import { HttpStatus } from "@/constants/httpStatus"

import createErrorResponseSchema from "../factories/createErrorResponseSchema"
import createZodErrorResponseSchema from "../factories/createZodErrorResponseSchema"
import { jsonContent } from "../helpers/jsonContent"

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

export const validationErrorResponse = (
  schemas: readonly [ZodType, ...ZodType[]],
  description = "Validation error"
) => {
  const [first, ...rest] = schemas.map(createZodErrorResponseSchema)

  const errorSchema = rest.reduce<ZodType>(
    (acc, schema) => acc.or(schema),
    first
  ) as typeof first

  return {
    [HttpStatus.UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, description),
  }
}
