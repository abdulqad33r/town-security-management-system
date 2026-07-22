import { OpenAPIHono } from "@hono/zod-openapi"
import { compress } from "hono/compress"
import { cors } from "hono/cors"
import { requestId } from "hono/request-id"

import {
  notFound,
  onError,
  pinoLogger,
  serveFavicon,
} from "@/middlewares"
import { HttpStatus } from "@/utils/constants/httpStatus"

import type { AppEnv } from "./types"

import formatZodError from "./errors/formatZodError"

export const createRouter = () =>
  new OpenAPIHono<AppEnv>({
    strict: false,
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          formatZodError(result.error),
          HttpStatus.UNPROCESSABLE_ENTITY
        )
      }
    },
  })

const createApp = () => {
  const app = createRouter()

  app
    .use(cors({ credentials: true }))
    .use(compress())
    .use(serveFavicon("🌚"))
    .use(requestId())
    .use(pinoLogger())

  app.notFound(notFound).onError(onError)

  return app
}

export default createApp
