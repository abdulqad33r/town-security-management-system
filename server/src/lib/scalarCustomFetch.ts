export const scalarCustomFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const tokenKey = "tsms.scalar.accessToken"

  const extractAccessToken = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null

    const record = value as Record<string, unknown>
    if (typeof record.accessToken === "string") return record.accessToken

    return extractAccessToken(record.data) ?? extractAccessToken(record.result)
  }

  const readAccessToken = async (response: Response) => {
    if (!response.headers.get("content-type")?.includes("application/json"))
      return null

    try {
      return extractAccessToken(await response.clone().json())
    } catch {
      return null
    }
  }

  const originalRequest = new Request(input, {
    ...init,
    credentials: "include",
  })

  const requestUrl = new URL(originalRequest.url)
  const pathname = requestUrl.pathname

  // Never try to refresh on login/register/refresh themselves
  const isAuthEndpoint = /\/auth\/(login|register|refresh)$/.test(pathname)

  const tokenBeforeRequest = sessionStorage.getItem(tokenKey)
  const headers = new Headers(originalRequest.headers)

  // The most recently stored token (from login/refresh) overrides whatever
  // Scalar's Auth panel sends. To switch users, log in as them.
  if (tokenBeforeRequest)
    headers.set("Authorization", `Bearer ${tokenBeforeRequest}`)

  const request = new Request(originalRequest, { headers })

  // Keep an unread copy so the request body can be replayed on retry
  const retryTemplate = request.clone()

  let response = await fetch(request)

  if (response.status === 401 && !isAuthEndpoint) {
    const refreshState = window as Window & {
      __tsmsRefreshPromise?: Promise<string | null>
    }

    let newAccessToken = sessionStorage.getItem(tokenKey)

    // If another request already refreshed, just reuse its token
    if (newAccessToken === tokenBeforeRequest) {
      if (!refreshState.__tsmsRefreshPromise) {
        refreshState.__tsmsRefreshPromise = (async () => {
          try {
            const refreshResponse = await fetch(
              new URL("/auth/refresh", requestUrl.origin),
              { method: "POST", credentials: "include" }
            )

            if (!refreshResponse.ok) return null
            return await readAccessToken(refreshResponse)
          } catch {
            return null
          }
        })()
      }

      try {
        newAccessToken = await refreshState.__tsmsRefreshPromise
      } finally {
        delete refreshState.__tsmsRefreshPromise
      }

      if (newAccessToken) sessionStorage.setItem(tokenKey, newAccessToken)
    }

    if (newAccessToken) {
      const retryHeaders = new Headers(retryTemplate.headers)
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`)

      response = await fetch(
        new Request(retryTemplate, { headers: retryHeaders })
      )
    } else {
      sessionStorage.removeItem(tokenKey)
    }
  }

  // Remember tokens returned by login/refresh
  const returnedToken = await readAccessToken(response)
  if (returnedToken) sessionStorage.setItem(tokenKey, returnedToken)

  // Forget the token after logout
  if (response.ok && /\/auth\/logout(?:-all)?$/.test(pathname))
    sessionStorage.removeItem(tokenKey)

  return response
}
