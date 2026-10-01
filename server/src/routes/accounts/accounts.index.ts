import { $ } from "@hono/zod-openapi"

import { PERMISSIONS } from "@/constants/permissions"
import { createRouter } from "@/lib/createApp"
import { requireAuth, requirePermission } from "@/middlewares"

import * as h from "./accounts.handlers"
import * as r from "./accounts.routes"

export default $(
  createRouter()
    .basePath("/accounts")
    .use(requireAuth)
    .use(requirePermission(PERMISSIONS.ACCOUNT_APPROVE))
).openapi(r.updateAccountStatus, h.updateAccountStatus)
