import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi"
import type { Logger } from "pino"

import type { UserRole } from "@/db/schema/enums"

export interface AppEnv {
  Variables: {
    logger: Logger
    accountId: string
    sessionId: string
    role: UserRole
  }
}

export type AppOpenApi = OpenAPIHono<AppEnv>

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>
