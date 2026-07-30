import redis from "./client"

export type Session = {
  sessionId: string
  userId: string
  hashedRefreshToken: string
  ip: string
  userAgent: string
  device?: string
  createdAt: string
  updatedAt: string
  lastUsedAt: string
  expiresAt: string
}

const sessionKey = (sessionId: string) => `session:${sessionId}`
const userSessionsKey = (userId: string) => `user_sessions:${userId}`

export async function createSession(session: Session, ttlSeconds: number) {
  await redis.set(sessionKey(session.sessionId), JSON.stringify(session))
  await redis.expire(sessionKey(session.sessionId), ttlSeconds)
  await redis.sadd(userSessionsKey(session.userId), session.sessionId)
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const raw = await redis.get(sessionKey(sessionId))
  return raw ? JSON.parse(raw) : null
}

export async function updateSession(
  sessionId: string,
  patch: Partial<Session>,
  ttlSeconds: number
) {
  const existing = await getSession(sessionId)
  if (!existing) return null

  const updated: Session = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  await redis.set(sessionKey(sessionId), JSON.stringify(updated))
  await redis.expire(sessionKey(sessionId), ttlSeconds)

  return updated
}

export async function deleteSession(sessionId: string, userId: string) {
  await redis.del(sessionKey(sessionId))
  await redis.srem(userSessionsKey(userId), sessionId)
}

export async function deleteAllSessions(userId: string) {
  const sessionIds = await redis.smembers(userSessionsKey(userId))

  if (sessionIds.length)
    await Promise.all(sessionIds.map(id => redis.del(sessionKey(id))))

  await redis.del(userSessionsKey(userId))
}

export async function listSessions(userId: string): Promise<Session[]> {
  const sessionIds = await redis.smembers(userSessionsKey(userId))
  const sessions = await Promise.all(sessionIds.map(getSession))

  return sessions.filter((s): s is Session => s !== null)
}
