import type { ZodType } from "zod"

import jsonContent from "./jsonContent"

const jsonContentRequired = <T extends ZodType>(
  schema: T,
  description: string
) => ({
  ...jsonContent(schema, description),
  required: true,
})

export default jsonContentRequired
