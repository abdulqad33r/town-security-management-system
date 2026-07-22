import { Scalar } from "@scalar/hono-api-reference"

import type { AppOpenApi } from "./types"

import { version } from "../../package.json"

const configureOpenAPI = (app: AppOpenApi) => {
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
    })
  )
}

export default configureOpenAPI
