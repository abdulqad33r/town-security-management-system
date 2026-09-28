import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test"

import type { Context } from "hono"

import { HttpStatus } from "@/constants/httpStatus"
import type { AppEnv } from "@/lib/types"
import * as sessionStore from "@/redis/session.store"
import * as tokenService from "@/services/token.service"

import { default as requireAuth } from "./auth.middleware"

let verifyAccessToken: ReturnType<typeof spyOn>
let getSession: ReturnType<typeof spyOn>
let next: ReturnType<typeof mock>

function makeContext(authorization?: string) {
  const values = new Map<string, unknown>()

  return {
    req: {
      header: (key: string) =>
        key === "Authorization" ? authorization : undefined,
    },
    set: (key: string, value: unknown) => {
      values.set(key, value)
    },
    get: (key: string) => values.get(key),
  } as Context<AppEnv, string>
}

// ─────────────────────────────────────────────
// requireAuth
// ─────────────────────────────────────────────
describe("requireAuth", () => {
  beforeEach(() => {
    verifyAccessToken = spyOn(
      tokenService,
      "verifyAccessToken"
    ).mockImplementation(() => {
      throw new Error("verifyAccessToken called without a mock value")
    })
    getSession = spyOn(sessionStore, "getSession").mockImplementation(() => {
      throw new Error("getSession called without a mock value")
    })

    next = mock(() => Promise.resolve())
  })

  afterEach(() => {
    mock.restore()
  })

  it("rejects when authorization header is missing", async () => {
    const c = makeContext()

    await expect(requireAuth(c, next)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      message: "Missing access token",
    })
    expect(verifyAccessToken).not.toHaveBeenCalled()
    expect(getSession).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it("rejects when authorization header is not a Bearer token", async () => {
    const c = makeContext("Basic abc123")

    await expect(requireAuth(c, next)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      message: "Missing access token",
    })
    expect(verifyAccessToken).not.toHaveBeenCalled()
    expect(getSession).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it("rejects when the access token is invalid", async () => {
    const invalidToken = "invalid-token"
    const c = makeContext(`Bearer ${invalidToken}`)

    verifyAccessToken.mockRejectedValue(new Error("Token verification failed"))

    await expect(requireAuth(c, next)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      message: "Invalid or expired access token",
    })
    expect(verifyAccessToken).toHaveBeenCalledWith(invalidToken)
    expect(getSession).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it("rejects when the session is no longer active", async () => {
    const validToken = "valid-token"
    const sessionId = "session-id"
    const c = makeContext(`Bearer ${validToken}`)

    verifyAccessToken.mockResolvedValue({
      sub: "account-id",
      sessionId,
      role: "resident",
    })

    getSession.mockResolvedValue(null)

    await expect(requireAuth(c, next)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      message: "Session no longer active",
    })
    expect(verifyAccessToken).toHaveBeenCalledWith(validToken)
    expect(getSession).toHaveBeenCalledWith(sessionId)
    expect(next).not.toHaveBeenCalled()
  })

  it("rejects when the session belongs to a different account", async () => {
    const c = makeContext("Bearer valid-token")

    verifyAccessToken.mockResolvedValue({
      sub: "account-id",
      sessionId: "session-id",
      role: "resident",
    })
    getSession.mockResolvedValue({ userId: "someone-else" })

    await expect(requireAuth(c, next)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
    })
    expect(next).not.toHaveBeenCalled()
  })

  it("sets the auth context and calls next() for a valid request", async () => {
    const validToken = "valid-token"
    const sub = "account-id"
    const sessionId = "session-id"
    const c = makeContext(`Bearer ${validToken}`)

    verifyAccessToken.mockResolvedValue({
      sub,
      sessionId,
      role: "resident",
    })
    getSession.mockResolvedValue({ userId: sub })

    await requireAuth(c, next)

    expect(verifyAccessToken).toHaveBeenCalledWith(validToken)
    expect(getSession).toHaveBeenCalledWith(sessionId)

    expect(c.get("accountId")).toBe(sub)
    expect(c.get("role")).toBe("resident")
    expect(c.get("sessionId")).toBe(sessionId)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
