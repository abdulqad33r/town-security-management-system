const _ERROR_TYPES = [
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "CONFLICT",
  "INTERNAL_ERROR",
] as const

export const ERROR_TYPES = Object.fromEntries(
  _ERROR_TYPES.map(type => [type, type])
) as {
  [K in (typeof _ERROR_TYPES)[number]]: K
}
export type ErrorType = (typeof _ERROR_TYPES)[number]
