import type z from "zod"

import { accountsSchema } from "@/db/schema"
import type { Session } from "@/redis/session.store"

import { hashPassword } from "./password.service"
import { beforeEach, describe, expect, it, mock } from "bun:test"

// ─────────────────────────────────────────────
// Fakes + factories
// ─────────────────────────────────────────────

const sessions = new Map<string, Session>()

mock.module("@/redis/session.store", () => ({
  getSession: async (sessionId: string) => sessions.get(sessionId) ?? null,
  updateSession: async (sessionId: string, patch: Partial<Session>) => {
    const existing = sessions.get(sessionId)
    if (!existing) return null

    const updated = { ...existing, ...patch }
    sessions.set(sessionId, updated)
    return updated
  },
  deleteSession: async (sessionId: string) => {
    sessions.delete(sessionId)
  },
  createSession: async (session: any) => {
    sessions.set(session.sessionId, session)
  },
  deleteAllSessions: async () => {},
  listSessions: async () => [],
}))

const accountsTestSchema = accountsSchema.pick({
  id: true,
  email: true,
  passwordHash: true,
  role: true,
  approvalStatus: true,
})
type Account = z.infer<typeof accountsTestSchema>

const accountsByEmail = new Map<string, Account>()
const accountsById = new Map<string, Account>()

mock.module("@/repositories/account.repository", () => ({
  findAccountByEmail: async (email: string) =>
    accountsByEmail.get(email) ?? null,
  findAccountById: async (id: string) => accountsById.get(id) ?? null,
  createAccount: async () => ({}),
  updateApprovalStatus: async () => ({}),
}))

const { login, refresh, revokeSession } = await import("./auth.service")
const { hashRefreshToken, generateRefreshToken } = await import(
  "./token.service"
)

/** Registers an account under both lookup maps and returns it. */
async function makeAccount(
  overrides: Partial<Account> & { password?: string } = {}
) {
  const { password = "correct-horse-battery-staple", ...rest } = overrides

  const account: Account = {
    id: crypto.randomUUID(),
    email: `${crypto.randomUUID()}@example.com`,
    passwordHash: await hashPassword(password),
    role: "resident",
    approvalStatus: "approved",
    ...rest,
  }

  accountsByEmail.set(account.email, account)
  accountsById.set(account.id, account)
  return account
}

/** Registers a session backed by a real (approved) account and returns { session, refreshToken, account }. */
async function makeSession(overrides: Partial<Session> = {}) {
  const account = await makeAccount({ id: overrides.userId })
  const refreshToken = generateRefreshToken()

  const session: Session = {
    sessionId: crypto.randomUUID(),
    userId: account.id,
    hashedRefreshToken: hashRefreshToken(refreshToken),
    ip: "127.0.0.1",
    userAgent: "test",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  }

  sessions.set(session.sessionId, session)
  return { session, refreshToken, account }
}

function resetFakes() {
  sessions.clear()
  accountsByEmail.clear()
  accountsById.clear()
}

// ─────────────────────────────────────────────
// refresh()
// ─────────────────────────────────────────────

describe("auth.service refresh()", () => {
  beforeEach(resetFakes)

  it("rotates the refresh token on a valid request", async () => {
    const { session, refreshToken } = await makeSession()

    const result = await refresh(session.sessionId, refreshToken)

    expect(result.accessToken).toBeString()
    expect(result.refreshToken).not.toBe(refreshToken)

    const stored = sessions.get(session.sessionId)
    expect(stored?.hashedRefreshToken).toBe(
      hashRefreshToken(result.refreshToken)
    )
  })

  it("rejects and destroys the session on refresh token reuse", async () => {
    const { session, refreshToken } = await makeSession()
    const wrongToken = generateRefreshToken()

    expect(refresh(session.sessionId, wrongToken)).rejects.toThrow()

    // reuse kills the whole session, not just the one request
    expect(sessions.has(session.sessionId)).toBe(false)
    // the ORIGINAL valid token no longer works either
    expect(refresh(session.sessionId, refreshToken)).rejects.toThrow()
  })

  it("rejects refresh for a session that doesn't exist", async () => {
    expect(
      refresh(crypto.randomUUID(), generateRefreshToken())
    ).rejects.toThrow()
  })

  it("rejects refresh when the backing account is no longer approved", async () => {
    const { session, refreshToken } = await makeSession()
    accountsById.set(session.userId, {
      // biome-ignore lint/style/noNonNullAssertion: <>
      ...accountsById.get(session.userId)!,
      approvalStatus: "suspended",
    })

    expect(refresh(session.sessionId, refreshToken)).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────
// login()
// ─────────────────────────────────────────────

describe("auth.service login()", () => {
  const meta = { ip: "127.0.0.1", userAgent: "test" }

  beforeEach(resetFakes)

  it("logs in successfully with correct credentials and an approved account", async () => {
    const password = "my-friend-rehan-cant-get-a-girl"
    const account = await makeAccount({ password })

    const result = await login({ email: account.email, password }, meta)

    expect(result.sessionId).toBeString()
    expect(result.accessToken).toBeString()
    expect(result.refreshToken).toBeString()
  })

  it("rejects an unknown email", async () => {
    expect(
      login({ email: "nobody@example.com", password: "whatever" }, meta)
    ).rejects.toThrow()
  })

  it("rejects the wrong password", async () => {
    const account = await makeAccount({ password: "the-real-password" })

    expect(
      login({ email: account.email, password: "wrong-password" }, meta)
    ).rejects.toThrow()
  })

  it("rejects a pending account even with the correct password", async () => {
    const password = "correct-horse-battery-staple"
    const account = await makeAccount({ password, approvalStatus: "pending" })

    expect(login({ email: account.email, password }, meta)).rejects.toThrow()
  })

  it("rejects a declined account", async () => {
    const password = "correct-horse-battery-staple"
    const account = await makeAccount({ password, approvalStatus: "declined" })

    expect(login({ email: account.email, password }, meta)).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────
// revokeSession()
// ─────────────────────────────────────────────

describe("auth.service revokeSession()", () => {
  beforeEach(resetFakes)

  it("lets the owner revoke their own session", async () => {
    const { session } = await makeSession()

    await revokeSession(session.sessionId, session.userId)
    expect(sessions.has(session.sessionId)).toBe(false)
  })

  it("rejects revoking someone else's session", async () => {
    const { session } = await makeSession()
    const otherUserId = crypto.randomUUID()

    expect(revokeSession(session.sessionId, otherUserId)).rejects.toThrow()
    expect(sessions.has(session.sessionId)).toBe(true)
  })

  it("rejects revoking a session that doesn't exist", async () => {
    expect(
      revokeSession(crypto.randomUUID(), crypto.randomUUID())
    ).rejects.toThrow()
  })
})
