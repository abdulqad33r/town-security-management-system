import type { OpenAPIHono } from "@hono/zod-openapi"
import type { Logger } from "pino"

export interface AppEnv {
  Variables: {
    logger: Logger
  }
}

export type AppOpenApi = OpenAPIHono<AppEnv>
