import type { Context } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import type { CookieOptions } from "hono/utils/cookie"

import { isDevEnv } from "@/config/env"

const REFRESH_COOKIE = "refresh_token"
const SESSION_COOKIE = "session_id"

export function setAuthCookies(
  c: Context,
  sessionId: string,
  refreshToken: string,
  maxAgeSeconds: number
) {
  const opts: CookieOptions = {
    httpOnly: true,
    secure: !isDevEnv,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  }

  setCookie(c, SESSION_COOKIE, sessionId, opts)
  setCookie(c, REFRESH_COOKIE, refreshToken, opts)
}

export const getAuthCookies = (c: Context) => ({
  sessionId: getCookie(c, SESSION_COOKIE),
  refreshToken: getCookie(c, REFRESH_COOKIE),
})

export function clearAuthCookies(c: Context) {
  deleteCookie(c, SESSION_COOKIE)
  deleteCookie(c, REFRESH_COOKIE)
}
