import type { ZodType } from "zod"

import dataResponseSchema from "../schemas/dataResponseSchema"

export const jsonContent = <T extends ZodType>(
  schema: T,
  description: string
) => ({
  content: { "application/json": { schema } },
  description,
})

export const jsonContentWithData = <T extends ZodType>(
  schema: T,
  description: string
) => ({
  content: { "application/json": { schema: dataResponseSchema(schema) } },
  description,
})

export const jsonContentRequired = <T extends ZodType>(
  schema: T,
  description: string
) => ({
  ...jsonContent(schema, description),
  required: true,
})
