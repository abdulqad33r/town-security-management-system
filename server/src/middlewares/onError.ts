import type { ErrorHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { ZodError } from "zod"

import { isDevEnv } from "@/config/env"
import type { ErrorType } from "@/constants/errorTypes"
// import { REFRESH_PATH } from "@/utils/constants"
import { HttpStatus } from "@/constants/httpStatus"
import formatZodError from "@/lib/errors/formatZodError"
import { getCleanStack, httpStatusToErrorType } from "@/lib/errors/httpErrors"

interface ErrorResponse {
  success: false
  type: ErrorType
  message: string
  errors?: Array<{
    message: string
    path?: string
  }>
  stack?: string
}

const onError: ErrorHandler = (error, c) => {
  let statusCode: ContentfulStatusCode = HttpStatus.INTERNAL_SERVER_ERROR
  const response: ErrorResponse = {
    success: false,
    type: "INTERNAL_ERROR",
    message: "Internal Server Error",
  }

  // Hono's built-in HTTP exception
  if (error instanceof HTTPException) {
    statusCode = error.status as ContentfulStatusCode
    response.type = httpStatusToErrorType(statusCode)
    response.message = error.message
  }

  // Zod validation error
  else if (error instanceof ZodError) {
    statusCode = HttpStatus.UNPROCESSABLE_ENTITY

    const formattedError = formatZodError(error)

    response.type = formattedError.type
    response.message = formattedError.message
    response.errors = formattedError.errors
  }

  // // JWT error
  // else if (error instanceof jwt.JsonWebTokenError) {
  //   statusCode = HttpStatus.UNAUTHORIZED
  //   response.message = "Invalid or expired token"
  // }
  // Generic fallback
  else if (Error.isError(error)) {
    response.message =
      isDevEnv && error.message ? error.message : "An unexpected error occurred"
  }

  // Stack trace in dev only
  if (isDevEnv) response.stack = getCleanStack(error)

  // // Clear auth cookies on failed refresh
  // if (c.req.path.includes(REFRESH_PATH) && statusCode === HttpStatus.UNAUTHORIZED) {
  //   deleteCookie(c, "accessToken")
  //   deleteCookie(c, "refreshToken")
  // }

  return c.json(response, statusCode)
}

export default onError
