import { configureOpenAPI, createApp } from "./lib"
import type { AppOpenApi } from "./lib/types"
import authRouter from "./routes/auth/auth.index"

const app = createApp()

app.get("/healthy", c => c.json({ status: "Healthy" }))

configureOpenAPI(app)

const routes: AppOpenApi[] = [authRouter]

routes.forEach(route => {
  app.route("/", route)
})

export default app
