import { sign, verify } from "hono/jwt"
import type { SignatureAlgorithm } from "hono/utils/jwt/jwa"

import env from "@/config/env"
import type { UserRole } from "@/db/schema/enums"
import type { Prettify } from "@/types"
import { parseExpiry } from "@/utils/parseExpiry"

export type AccessTokenPayload = {
  sub: string
  role: UserRole
  sessionId: string
  exp: number
}

const ALG: SignatureAlgorithm = "HS256"

export const signAccessToken = (
  payload: Prettify<Omit<AccessTokenPayload, "exp">>
) => {
  const exp: number =
    Math.floor(Date.now() / 1000) + parseExpiry(env.JWT_ACCESS_EXPIRES_IN)

  return sign({ ...payload, exp }, env.JWT_ACCESS_SECRET, ALG)
}

export const verifyAccessToken = (token: string) =>
  verify(token, env.JWT_ACCESS_SECRET, ALG) as Promise<AccessTokenPayload>

export const generateRefreshToken = () =>
  crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "")

export const hashRefreshToken = (
  token: ReturnType<typeof generateRefreshToken>
) => Bun.CryptoHasher.hash("sha256", token, "hex")
//   const hasher = new Bun.CryptoHasher("sha256")
//   hasher.update(token)
//   return hasher.digest("hex")
// }
