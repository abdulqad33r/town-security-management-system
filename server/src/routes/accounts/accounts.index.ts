import { $ } from "@hono/zod-openapi"

import { PERMISSIONS } from "@/constants/permissions"
import { createRouter } from "@/lib/createApp"
import { requireAuth, requirePermission } from "@/middlewares"

import * as h from "./accounts.handlers"
import * as r from "./accounts.routes"

const approvalRouter = $(
  createRouter()
    .use(requireAuth)
    .use(requirePermission(PERMISSIONS.ACCOUNT_APPROVE))
).openapi(r.updateAccountStatus, h.updateAccountStatus)

const readRouter = $(
  createRouter()
    .use(requireAuth)
    .use(requirePermission(PERMISSIONS.ACCOUNT_MANAGE_ANY))
).openapi(r.getAccount, h.getAccount)

export default $(createRouter().basePath("/accounts"))
  .route("/", approvalRouter)
  .route("/", readRouter)
