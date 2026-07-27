import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { ZodError } from "zod"

import type { ErrorType } from "@/utils/constants"
import { HttpStatus } from "@/utils/constants/httpStatus"

function cleanStack(stack: string) {
  return stack
    .split("\n")
    .filter(line => {
      const normalized = line.toLowerCase()

      // (!normalized.includes("hono/dist") &&
      // !normalized.includes("hono/") &&
      // !normalized.includes("internal/") &&
      // !normalized.includes("node:internal"))

      // || normalized.startsWith("error: ")

      return (
        !normalized.includes("node_modules") &&
        normalized.includes("\\src\\")
      )
    })
    .map(line => line.trimStart())
    .join(" ")
}

export function getCleanStack(
  err: Error | HTTPException | ZodError | unknown
) {
  // if (err instanceof ZodError)
  //   // INFO: Below I'm doing `slice(-1).join("\n")` to get the last line of the stack trace which looks like this "at createTaskHandler (D:\MERN Stack\testing\hono-node\src\routes\tasks\tasks.handlers.ts:17:34)" and is the most relevant for debugging
  //   return `Zod Validation Error ${cleanStack(err.stack)?.slice(-1).join("\n")}`
  // else if (err instanceof HTTPException || err instanceof Error)
  //   return cleanStack(err.stack)?.join(" ")

  if (!Error.isError(err) || !err.stack) return undefined

  const stack = cleanStack(err.stack) ?? ""

  const prefix =
    err instanceof ZodError ? "Zod Validation Error" : "Error"

  return `${prefix} ${stack}`
}

export function throwError(
  status: ContentfulStatusCode,
  message: string,
  stackStartFn: typeof appAssert | typeof throwError = throwError
): never {
  const err = new HTTPException(status, { message })

  Error.captureStackTrace?.(err, stackStartFn)

  throw err
}

export function appAssert(
  condition: unknown,
  status: ContentfulStatusCode,
  message: string
): asserts condition {
  if (!condition) throwError(status, message, appAssert)
}

export const httpStatusToErrorType = (status: number): ErrorType => {
  switch (status) {
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND"
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHORIZED"
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN"
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return "VALIDATION_ERROR"
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "INTERNAL_ERROR"
  }
}
