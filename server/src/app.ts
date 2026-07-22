import type { AppOpenApi } from "./lib/types"

import { configureOpenAPI, createApp } from "./lib"

const app = createApp()

app.get("/healthy", c => c.json({ status: "Healthy" }))

configureOpenAPI(app)

const routes: AppOpenApi[] = []

routes.forEach(route => {
  app.route("/", route)
})

export default app
