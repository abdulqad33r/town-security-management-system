import { z } from "@hono/zod-openapi"

import { ERROR_TYPES } from "@/constants/errorTypes"

const createZodErrorResponseSchema = <T extends z.ZodType>(schema: T) => {
  const invalidInput = (() => {
    if (schema.def.type === "array") {
      const element = (schema as unknown as z.ZodArray<z.ZodType>).element
      return [element.def.type === "string" ? 123 : "invalid"]
    } else if (schema.def.type === "object") {
      const shape = (schema as unknown as z.ZodObject).shape
      const firstKey = Object.keys(shape)[0]
      return firstKey ? { [firstKey]: Symbol("invalid") } : {}
    }

    return {}
  })()

  const { error } = schema.safeParse(invalidInput)

  const errors = error
    ? error.issues.map(issue => ({
        message: issue.message.replace("symbol", "undefined"),
        path: issue.path.join("."),
      }))
    : [
        {
          message: "Expected string, received undefined",
          path: "fieldName",
        },
      ]

  return z.object({
    type: z
      .literal(ERROR_TYPES.VALIDATION_ERROR)
      .openapi({ example: ERROR_TYPES.VALIDATION_ERROR }),
    message: z.string().openapi({ example: "Validation Failed" }),
    errors: z
      .array(
        z.object({
          message: z.string(),
          path: z.string(),
        })
      )
      .openapi({ example: errors }),
  })
}

export default createZodErrorResponseSchema
