import type { HttpErrorStatusCode } from "./httpStatus"
import { HttpStatus } from "./httpStatus"

export const HttpErrorStatusByCode = Object.fromEntries(
  Object.entries(HttpStatus)
    .filter(([_, value]) => value >= 400)
    .map(([key, value]) => [
      value,
      key === "UNPROCESSABLE_ENTITY" ? "VALIDATION_ERROR" : key,
    ])
) as {
  [K in HttpErrorStatusCode]: K extends typeof HttpStatus.UNPROCESSABLE_ENTITY
    ? "VALIDATION_ERROR"
    : {
        [V in keyof typeof HttpStatus]: (typeof HttpStatus)[V] extends K
          ? V
          : never
      }[keyof typeof HttpStatus]
}

export type HttpErrorStatusLabel =
  (typeof HttpErrorStatusByCode)[keyof typeof HttpErrorStatusByCode]

export const HttpErrorStatusLabels = Object.fromEntries(
  Object.values(HttpErrorStatusByCode).map(type => [type, type])
) as {
  [K in HttpErrorStatusLabel]: K
}
