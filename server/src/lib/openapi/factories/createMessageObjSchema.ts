import { z } from "@hono/zod-openapi"

const createMessageObjSchema = <T extends string>(
  exampleMessage: T = "Example Message" as T
) =>
  z.object({ message: z.string() }).openapi({
    example: {
      message: exampleMessage,
    },
  })

export default createMessageObjSchema
