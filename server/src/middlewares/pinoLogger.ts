import { structuredLogger } from "@hono/structured-logger"
import { HTTPException } from "hono/http-exception"
import type { SerializerFn } from "pino"
import pino from "pino"
import PinoPretty from "pino-pretty"
import { ZodError } from "zod"

import env, { isDevEnv } from "@/config/env"
import formatZodError from "@/lib/errors/formatZodError"
import { getCleanStack } from "@/lib/errors/httpErrors"

const pretty = PinoPretty({
  ignore: "pid,hostname",
  translateTime: "dd-mm-yyyy HH:MM:ss.l",
})

const serializeError: SerializerFn = (error: unknown) => {
  const type = error !== null ? (error as any).constructor.name : undefined
  const stack = getCleanStack(error)

  if (error instanceof ZodError) return { ...formatZodError(error), stack }
  else if (error instanceof HTTPException)
    return { type, message: error.message, stack }
  else if (Error.isError(error))
    return { ...pino.stdSerializers.err(error), type, stack }

  return { message: String(error) }
}

const rootLogger = pino(
  {
    level: env.LOG_LEVEL,
    serializers: {
      err: serializeError,
    },
  },
  isDevEnv ? pretty : undefined
)

const pinoLogger = () =>
  structuredLogger({
    createLogger: c => rootLogger.child({ requestId: c.var.requestId }),
  })

export default pinoLogger
