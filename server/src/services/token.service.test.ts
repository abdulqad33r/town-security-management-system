import { describe, expect, it } from "bun:test"

import { sign } from "hono/jwt"

import env from "@/config/env"

import type { AccessTokenPayload } from "./token.service"
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from "./token.service"

describe("access tokens", () => {
  const payload: Omit<AccessTokenPayload, "exp"> = {
    sub: crypto.randomUUID(),
    role: "resident",
    sessionId: crypto.randomUUID(),
  }

  it("signs and verifies a valid token round-trip", async () => {
    const token = await signAccessToken(payload)
    const decoded = await verifyAccessToken(token)

    expect(decoded.sub).toBe(payload.sub)
    expect(decoded.role).toBe(payload.role)
    expect(decoded.sessionId).toBe(payload.sessionId)
  })

  it("sets an expiry roughly matching JWT_ACCESS_EXPIRES_IN", async () => {
    const before = Math.floor(Date.now() / 1000)
    const token = await signAccessToken(payload)
    const decoded = await verifyAccessToken(token)

    // exp should be ~15 minutes out - allow a couple seconds of test-run drift
    expect(decoded.exp).toBeGreaterThan(before + 14 * 60)
    expect(decoded.exp).toBeLessThan(before + 16 * 60)
  })

  it("rejects a tampered token", async () => {
    // sanity check that verification actually checks the signature, not just decodes the payload
    const token = await signAccessToken(payload)
    const tampered = `${token.slice(0, -4)}abcd`

    await expect(verifyAccessToken(tampered)).rejects.toThrow()
  })

  it("rejects a token signed with a different secret", async () => {
    const token = await sign(payload, "different-secret", "HS256")

    await expect(verifyAccessToken(token)).rejects.toThrow()
  })

  it("rejects an expired token", async () => {
    const expired = await sign(
      {
        ...payload,
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      env.JWT_ACCESS_SECRET,
      "HS256"
    )

    await expect(verifyAccessToken(expired)).rejects.toThrow()
  })
})

describe("refresh tokens", () => {
  it("generates unique token on each call", () => {
    const tokenA = generateRefreshToken()
    const tokenB = generateRefreshToken()

    expect(tokenA).not.toBe(tokenB)
    expect(tokenA.length).toBeGreaterThan(20)
  })

  it("hashes deterministically - same token, same hash", () => {
    const token = generateRefreshToken()

    const hashA = hashRefreshToken(token)
    const hashB = hashRefreshToken(token)

    expect(hashA).toBe(hashB)
  })

  it("produces different hashes for different tokens", () => {
    const tokenA = generateRefreshToken()
    const tokenB = generateRefreshToken()

    const hashA = hashRefreshToken(tokenA)
    const hashB = hashRefreshToken(tokenB)

    expect(hashA).not.toBe(hashB)
  })
})
