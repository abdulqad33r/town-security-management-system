import { configureOpenAPI, createApp } from "./lib"
import type { AppOpenApi } from "./lib/types"

const app = createApp()

app.get("/healthy", c => c.json({ status: "Healthy" }))

configureOpenAPI(app)

const routes: AppOpenApi[] = []

routes.forEach(route => {
  app.route("/", route)
})

export default app
