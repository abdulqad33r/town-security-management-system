import { Scalar } from "@scalar/hono-api-reference"

import { isDevEnv } from "@/config/env"

import { version } from "../../package.json"
import { scalarCustomFetch } from "./scalarCustomFetch"
import type { AppOpenApi } from "./types"

const configureOpenAPI = (app: AppOpenApi) => {
  if (!isDevEnv) return

  app.doc("/doc", {
    info: {
      title: "Town Security Management System API",
      version,
    },
    openapi: "3.0.0",
  })

  app.get(
    "/scalar",
    Scalar({
      url: "/doc",
      defaultHttpClient: {
        clientKey: "axios",
        targetKey: "js",
      },
      theme: "kepler",
      customFetch: scalarCustomFetch as typeof fetch,
    })
  )
}

export default configureOpenAPI
