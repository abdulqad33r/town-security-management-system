import { z } from "@hono/zod-openapi"

import type { HttpErrorStatusLabel } from "@/constants/errorTypes"

const createErrorResponseSchema = <T extends HttpErrorStatusLabel>(
  type: T,
  exampleMessage: string
) =>
  z.object({
    success: z.literal(false),
    type: z.literal(type).openapi({ example: type }),
    message: z.string().openapi({ example: exampleMessage }),
  })

export default createErrorResponseSchema
