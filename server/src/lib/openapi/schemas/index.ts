import { z } from "@hono/zod-openapi"

export const idParamsSchema = z.object({
  id: z.uuid().openapi({
    example: "092392c5-e9b8-4504-8f01-e117060d6232",
    param: {
      in: "path",
      name: "id",
    },
  }),
})
