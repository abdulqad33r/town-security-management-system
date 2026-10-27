import { HTTPException } from "hono/http-exception"
import { ZodError } from "zod"

import type { HttpErrorStatusCode } from "@/constants/httpStatus"

const cleanStack = (stack: string) =>
  stack
    .split("\n")
    .find(line => {
      const normalized = line.toLowerCase()

      return !normalized.includes("node_modules") && /[\\/]src[\\/]/.test(line)
    })
    ?.trimStart()

export function getCleanStack(err: Error | HTTPException | ZodError | unknown) {
  if (!Error.isError(err) || !err.stack) return undefined

  const stack = cleanStack(err.stack)

  if (!stack) return undefined

  const prefix = err instanceof ZodError ? "Zod Validation Error" : "Error"

  return `${prefix} ${stack}`
}

export function throwError(
  status: HttpErrorStatusCode,
  message: string,
  stackStartFn: typeof appAssert | typeof throwError = throwError
): never {
  const err = new HTTPException(status, { message })

  Error.captureStackTrace?.(err, stackStartFn)

  throw err
}

export function appAssert(
  condition: unknown,
  status: HttpErrorStatusCode,
  message: string
): asserts condition {
  if (!condition) throwError(status, message, appAssert)
}
