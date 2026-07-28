export const parseExpiry = (exp: string): number => {
  const match = exp.match(/^(\d+)([smhd])$/)
  if (!match) throw new Error(`Invalid expiry format: ${exp}`)

  const [, value, unit] = match

  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 } as const

  return Number(value) * multipliers[unit as keyof typeof multipliers]
}
