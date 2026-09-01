import { $ } from "@hono/zod-openapi"

import { createRouter } from "@/lib/createApp"
import { requireAuth } from "@/middlewares"

import * as h from "./auth.handlers"
import * as r from "./auth.routes"

const router = createRouter()
  .basePath("/auth")
  .openapi(r.register, h.register)
  .openapi(r.login, h.login)
  .openapi(r.refresh, h.refresh)

const protectedRouter = $(createRouter().use(requireAuth))
  .openapi(r.logout, h.logout)
  .openapi(r.logoutAll, h.logoutAll)
  .openapi(r.me, h.me)
  .openapi(r.listSessions, h.listSessions)
  .openapi(r.revokeSession, h.revokeSessions)

export default router.route("/", protectedRouter)
