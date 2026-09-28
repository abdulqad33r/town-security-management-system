import { beforeEach, describe, expect, it, mock } from "bun:test"

import type z from "zod"

import { HttpStatus } from "@/constants/httpStatus"
import { accountsSchema } from "@/db/schema"
import type { Session } from "@/redis/session.store"
import type { CreatedAccount } from "@/types/auth.types"
import type { RegisterInput } from "@/validators/auth.validators"

import { hashPassword, verifyPassword } from "./password.service"

// ─────────────────────────────────────────────
// Fakes + factories
// ─────────────────────────────────────────────

const sessions = new Map<string, Session>()

mock.module("@/redis/session.store", () => ({
  getSession: async (sessionId: string) => sessions.get(sessionId) ?? null,
  updateSession: async (sessionId: string, patch: Partial<Session>) => {
    await Bun.sleep(20) // simulate network latency
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
  createAccount: async (data: any) => {
    const account = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      approvalStatus: "pending",
      ...data,
    }
    accountsByEmail.set(account.email, account)
    accountsById.set(account.id, account)
    return account as CreatedAccount
  },
  updateApprovalStatus: async () => ({}),
}))

const { login, refresh, register, revokeSession } = await import(
  "./auth.service"
)
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

    await expect(refresh(session.sessionId, wrongToken)).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      message: "Refresh token reuse detected - session terminated",
    })

    // reuse kills the whole session, not just the one request
    expect(sessions.has(session.sessionId)).toBe(false)
    // the ORIGINAL valid token no longer works either
    await expect(
      refresh(session.sessionId, refreshToken)
    ).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      message: "Session not found",
    })
  })

  it("rejects refresh for a session that doesn't exist", async () => {
    await expect(
      refresh(crypto.randomUUID(), generateRefreshToken())
    ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED })
  })

  it("rejects refresh when the backing account is no longer approved", async () => {
    const { session, refreshToken } = await makeSession()
    accountsById.set(session.userId, {
      // biome-ignore lint/style/noNonNullAssertion: <>
      ...accountsById.get(session.userId)!,
      approvalStatus: "suspended",
    })

    await expect(
      refresh(session.sessionId, refreshToken)
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN })
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
    await expect(
      login({ email: "nobody@example.com", password: "whatever" }, meta)
    ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED })
  })

  it("rejects the wrong password", async () => {
    const account = await makeAccount({ password: "the-real-password" })

    await expect(
      login({ email: account.email, password: "wrong-password" }, meta)
    ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED })
  })

  it("rejects a pending account even with the correct password", async () => {
    const password = "correct-horse-battery-staple"
    const account = await makeAccount({ password, approvalStatus: "pending" })

    await expect(
      login({ email: account.email, password }, meta)
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN })
  })

  it("rejects a declined account", async () => {
    const password = "correct-horse-battery-staple"
    const account = await makeAccount({ password, approvalStatus: "declined" })

    await expect(
      login({ email: account.email, password }, meta)
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN })
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

    await expect(
      revokeSession(session.sessionId, otherUserId)
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN })
    expect(sessions.has(session.sessionId)).toBe(true)
  })

  it("rejects revoking a session that doesn't exist", async () => {
    await expect(
      revokeSession(crypto.randomUUID(), crypto.randomUUID())
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND })
  })
})

// ─────────────────────────────────────────────
// register()
// ─────────────────────────────────────────────
describe("auth.service register()", () => {
  beforeEach(resetFakes)

  it("registers successfully with correct credentials", async () => {
    const input: RegisterInput = {
      firstName: "firstName",
      lastName: "lastName",
      email: "new@example.com",
      phone: "000000000000",
      password: "correct-horse-battery-staple",
      role: "resident",
    }

    const { approvalStatus, passwordHash } = await register(input)

    expect(approvalStatus).toBe("pending")
    expect(await verifyPassword(input.password, passwordHash)).toBe(true)
    expect(accountsByEmail.has(input.email)).toBe(true)
    expect(sessions.size).toBe(0)
  })

  it("rejects the duplicate email", async () => {
    const email = "new@example.com"
    const password = "correct-horse-battery-staple"
    await makeAccount({ email, password, approvalStatus: "pending" })

    const input: RegisterInput = {
      firstName: "firstName",
      lastName: "lastName",
      email,
      phone: "000000000000",
      password,
      role: "resident",
    }

    await expect(register(input)).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    })
    expect(accountsByEmail.size).toBe(1)
  })
})
