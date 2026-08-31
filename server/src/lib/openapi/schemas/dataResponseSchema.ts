import { z } from "@hono/zod-openapi"
import type { ZodType } from "zod"

const dataResponseSchema = <T extends ZodType>(schema: T) =>
  z.object({ success: z.literal(true), data: schema })

export default dataResponseSchema
