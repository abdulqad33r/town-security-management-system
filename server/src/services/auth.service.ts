import env from "@/config/env"
import { HttpStatus } from "@/constants/httpStatus"
import { appAssert, throwError } from "@/lib/errors/httpErrors"
import {
  createSession,
  deleteAllSessions,
  deleteSession,
  getSession,
  listSessions as listSessionsStore,
  updateSession,
} from "@/redis/session.store"
import {
  createAccount,
  findAccountByEmail,
  findAccountById,
} from "@/repositories/account.repository"
import type { Account, DeviceMeta } from "@/types/auth.types"
import { omitFields } from "@/utils/object"
import type { LoginInput, RegisterInput } from "@/validators/auth.validators"

import { hashPassword, verifyPassword } from "./password.service"
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from "./token.service"

const REFRESH_TTL_SECONDS = env.REFRESH_TOKEN_EXPIRES_DAYS * 86400

// ? ───────────────── Register ─────────────────
export async function register(input: RegisterInput) {
  const existing = await findAccountByEmail(input.email)
  appAssert(!existing, HttpStatus.CONFLICT, "Email already registered")

  const passwordHash = await hashPassword(input.password)

  const account = await createAccount({
    ...omitFields(input, ["password"]),
    passwordHash,
  })

  return account
}

// ? ───────────────── Login ─────────────────
export async function login(input: LoginInput, meta: DeviceMeta) {
  const account = await findAccountByEmail(input.email)
  appAssert(account, HttpStatus.UNAUTHORIZED, "Invalid email or password")

  const validPassword = await verifyPassword(
    input.password,
    account.passwordHash
  )
  appAssert(validPassword, HttpStatus.UNAUTHORIZED, "Invalid email or password")

  appAssert(
    account.approvalStatus === "approved",
    HttpStatus.FORBIDDEN,
    `Account is ${account.approvalStatus}`
  )

  return issueSession(account, meta)
}

async function issueSession(account: Account, { ip, userAgent }: DeviceMeta) {
  const sessionId = crypto.randomUUID()
  const refreshToken = generateRefreshToken()
  const hashedRefreshToken = hashRefreshToken(refreshToken)
  const now = new Date().toISOString()

  await createSession(
    {
      sessionId,
      userId: account.id,
      hashedRefreshToken,
      ip,
      userAgent,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
      expiresAt: new Date(
        Date.now() + REFRESH_TTL_SECONDS * 1000
      ).toISOString(),
    },
    REFRESH_TTL_SECONDS
  )
}

// ? ───────────────── Refresh ─────────────────
export async function refresh(sessionId: string, refreshToken: string) {
  const session = await getSession(sessionId)
  appAssert(session, HttpStatus.UNAUTHORIZED, "Session not found")

  const providedHash = hashRefreshToken(refreshToken)

  if (providedHash !== session.hashedRefreshToken) {
    // Reuse detected - someone presented an old/invalid refresh token
    // for this session. Kill the whole session immediately.
    await deleteSession(sessionId, session.userId)
    throwError(
      HttpStatus.UNAUTHORIZED,
      "Refresh token reuse detected - session terminated"
    )
  }

  const account = await findAccountById(session.userId)
  appAssert(account, HttpStatus.UNAUTHORIZED, "Account not found")
  appAssert(
    account.approvalStatus === "approved",
    HttpStatus.FORBIDDEN,
    `Account is ${account.approvalStatus}`
  )

  // Rotate: new refresh token, same session, previous token now invalid
  const newRefreshToken = generateRefreshToken()
  const newHashed = hashRefreshToken(newRefreshToken)

  updateSession(
    sessionId,
    {
      hashedRefreshToken: newHashed,
      lastUsedAt: new Date().toISOString(),
    },
    REFRESH_TTL_SECONDS
  )

  const accessToken = await signAccessToken({
    sub: account.id,
    role: account.role,
    sessionId,
  })

  return { accessToken, refreshToken: newRefreshToken }
}

// ? ───────────────── Logout ─────────────────
export const logout = (sessionId: string, userId: string) =>
  deleteSession(sessionId, userId)

export const logoutAll = (userId: string) => deleteAllSessions(userId)

// ? ───────────────── List Sessions ─────────────────
export const listSessions = (userId: string) => listSessionsStore(userId)

// ? ───────────────── Revoke Session ─────────────────
export async function revokeSession(
  sessionId: string,
  requestingUserId: string
) {
  const session = await getSession(sessionId)
  appAssert(session, HttpStatus.NOT_FOUND, "Session not found")
  appAssert(
    session.userId === requestingUserId,
    HttpStatus.FORBIDDEN,
    "Cannot revoke session of another user"
  )

  await deleteSession(sessionId, requestingUserId)
}
