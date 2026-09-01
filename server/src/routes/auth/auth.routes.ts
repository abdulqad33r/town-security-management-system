import { createRoute as route, z } from "@hono/zod-openapi"

import { HttpStatus } from "@/constants/httpStatus"
import { getMeSchema } from "@/db/schema"
import { createMessageObjSchema, jsonContent } from "@/lib/openapi"
import dataResponseSchema from "@/lib/openapi/schemas/dataResponseSchema"
import {
  errorResponse,
  notFoundErrorResponse,
  validationErrorResponse,
} from "@/lib/openapi/schemas/responseSchemas"
import { sessionSchema } from "@/redis/session.store"
import { loginSchema, registerSchema } from "@/validators/auth.validators"

const tags = ["Auth"] as const satisfies string[]

const accessTokenSchema = z.object({ accessToken: z.string() }).strict()

export const register = route({
  path: "/register",
  method: "post",
  tags,
  request: {
    body: jsonContent(registerSchema, "Account registration payload"),
  },
  responses: {
    [HttpStatus.CREATED]: jsonContent(
      dataResponseSchema(
        createMessageObjSchema("Registration submitted, pending approval")
      ),
      "Account created, pending manager approval"
    ),

    ...errorResponse(HttpStatus.CONFLICT, "Email already registered"),
    ...validationErrorResponse([registerSchema], "Validation error"),
  },
})

export const login = route({
  path: "/login",
  method: "post",
  tags,
  request: {
    body: jsonContent(loginSchema, "Login credentials"),
  },
  responses: {
    [HttpStatus.OK]: jsonContent(
      dataResponseSchema(accessTokenSchema),
      "Login successful"
    ),

    ...errorResponse(HttpStatus.UNAUTHORIZED, "Invalid email or password"),
    ...errorResponse(HttpStatus.FORBIDDEN, "Account is pending"),
    ...validationErrorResponse([loginSchema], "Validation error"),
  },
})

export const refresh = route({
  path: "/refresh",
  method: "post",
  tags,
  responses: {
    [HttpStatus.OK]: jsonContent(
      dataResponseSchema(accessTokenSchema),
      "Token refreshed"
    ),

    ...errorResponse(
      HttpStatus.UNAUTHORIZED,
      "Session not found",
      "Invalid or reused refresh token"
    ),
    ...errorResponse(HttpStatus.FORBIDDEN, "Account is pending"),
  },
})

export const logout = route({
  path: "/logout",
  method: "post",
  tags,
  responses: {
    [HttpStatus.OK]: jsonContent(
      dataResponseSchema(createMessageObjSchema("Logged out")),
      "Session ended"
    ),
  },
})

export const logoutAll = route({
  path: "/logout-all",
  method: "post",
  tags,
  responses: {
    [HttpStatus.OK]: jsonContent(
      dataResponseSchema(createMessageObjSchema("All sessions ended")),
      "All sessions ended"
    ),
  },
})

export const me = route({
  path: "/me",
  method: "get",
  tags,
  responses: {
    [HttpStatus.OK]: jsonContent(
      dataResponseSchema(getMeSchema),
      "Current account"
    ),
  },
})

export const listSessions = route({
  path: "/sessions",
  method: "get",
  tags,
  responses: {
    [HttpStatus.OK]: jsonContent(
      dataResponseSchema(
        z.object({
          sessions: z.array(
            sessionSchema.pick({
              sessionId: true,
              ip: true,
              userAgent: true,
              createdAt: true,
              lastUsedAt: true,
            })
          ),
        })
      ),
      "Active sessions for the current account"
    ),
  },
})

export const revokeSession = route({
  path: "/sessions/{id}",
  method: "delete",
  tags,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    [HttpStatus.OK]: jsonContent(
      dataResponseSchema(createMessageObjSchema("Session revoked")),
      "Session revoked"
    ),

    ...errorResponse(
      HttpStatus.FORBIDDEN,
      "Cannot revoke another user's session"
    ),
    ...notFoundErrorResponse("Session not found"),
  },
})

export type RegisterRoute = typeof register
export type LoginRoute = typeof login
export type RefreshRoute = typeof refresh
export type LogoutRoute = typeof logout
export type LogoutAllRoute = typeof logoutAll
export type MeRoute = typeof me
export type ListSessionsRoute = typeof listSessions
export type RevokeSessionRoute = typeof revokeSession
