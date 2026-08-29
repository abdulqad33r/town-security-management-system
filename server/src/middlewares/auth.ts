import type { MiddlewareHandler } from "hono"

import { HttpStatus } from "@/constants/httpStatus"
import { throwError } from "@/lib/errors/httpErrors"
import type { AppEnv } from "@/lib/types"
import { getSession } from "@/redis/session.store"
import { verifyAccessToken } from "@/services/token.service"

const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token) throwError(HttpStatus.UNAUTHORIZED, "Missing access token")

  const { sub, sessionId, role } = await verifyAccessToken(token).catch(() =>
    throwError(HttpStatus.UNAUTHORIZED, "Invalid or expired access token")
  )

  const session = getSession(sessionId)
  if (!session) throwError(HttpStatus.UNAUTHORIZED, "Session no longer active")

  c.set("accountId", sub)
  c.set("role", role)
  c.set("sessionId", sessionId)

  await next()
}

export default requireAuth
