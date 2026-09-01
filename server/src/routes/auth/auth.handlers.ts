import { HttpStatus } from "@/constants/httpStatus"
import { appAssert } from "@/lib/errors/httpErrors"
import { success } from "@/lib/success"
import type { AppRouteHandler } from "@/lib/types"
import { findAccountById } from "@/repositories/account.repository"
import * as authService from "@/services/auth.service"
import {
  clearAuthCookies,
  getAuthCookies,
  setAuthCookies,
} from "@/utils/cookies"
import type { LoginInput, RegisterInput } from "@/validators/auth.validators"

import type {
  ListSessionsRoute,
  LoginRoute,
  LogoutAllRoute,
  LogoutRoute,
  MeRoute,
  RefreshRoute,
  RegisterRoute,
  RevokeSessionRoute,
} from "./auth.routes"

export const register: AppRouteHandler<RegisterRoute> = async c => {
  const body = c.req.valid("json") satisfies RegisterInput
  await authService.register(body)

  return c.json(
    success({ message: "Registration submitted, pending approval" }),
    HttpStatus.CREATED
  )
}

export const login: AppRouteHandler<LoginRoute> = async c => {
  const body = c.req.valid("json") satisfies LoginInput
  const { accessToken, refreshToken, sessionId } = await authService.login(
    body,
    {
      ip: c.req.header("X-Forwarded-For") ?? "unknown",
      userAgent: c.req.header("User-Agent") ?? "unknown",
    }
  )

  setAuthCookies(c, sessionId, refreshToken, authService.REFRESH_TTL_SECONDS)

  return c.json(success({ accessToken }), HttpStatus.OK)
}

export const refresh: AppRouteHandler<RefreshRoute> = async c => {
  const { sessionId, refreshToken } = getAuthCookies(c)
  appAssert(
    refreshToken && sessionId,
    HttpStatus.UNAUTHORIZED,
    "Missing session or refresh token"
  )
  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refresh(sessionId, refreshToken)

  setAuthCookies(c, sessionId, newRefreshToken, authService.REFRESH_TTL_SECONDS)

  return c.json(success({ accessToken }), HttpStatus.OK)
}

export const logout: AppRouteHandler<LogoutRoute> = async c => {
  await authService.logout(c.get("sessionId"), c.get("accountId"))
  clearAuthCookies(c)

  return c.json(success({ message: "Logged out" }), HttpStatus.OK)
}

export const logoutAll: AppRouteHandler<LogoutAllRoute> = async c => {
  await authService.logoutAll(c.get("accountId"))
  clearAuthCookies(c)

  return c.json(success({ message: "All sessions ended" }), HttpStatus.OK)
}

export const me: AppRouteHandler<MeRoute> = async c => {
  const account = await findAccountById(c.get("accountId"))
  appAssert(account, HttpStatus.NOT_FOUND, "Account not found")

  return c.json(
    success({
      id: account.id,
      role: account.role,
      approvalStatus: account.approvalStatus,
    }),
    HttpStatus.OK
  )
}

export const listSessions: AppRouteHandler<ListSessionsRoute> = async c => {
  const sessions = await authService.listSessions(c.get("accountId"))

  return c.json(success({ sessions }), HttpStatus.OK)
}

export const revokeSessions: AppRouteHandler<RevokeSessionRoute> = async c => {
  const { id } = c.req.valid("param")
  await authService.revokeSession(id, c.get("accountId"))

  return c.json(success({ message: "Session revoked" }), HttpStatus.OK)
}
