type TimeUnit = "milliseconds" | "seconds" | "minutes" | "hours" | "days"

const MS_PER_UNIT = {
  milliseconds: 1,
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
} as const

export const convertTime = (
  value: number,
  from: TimeUnit,
  to: TimeUnit
): number => (value * MS_PER_UNIT[from]) / MS_PER_UNIT[to]
