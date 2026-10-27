import { configureOpenAPI, createApp } from "./lib"
import type { AppOpenApi } from "./lib/types"
import accountsRouter from "./routes/accounts/accounts.index"
import authRouter from "./routes/auth/auth.index"
import locationsRouter from "./routes/locations/locations.index"

const app = createApp()

app.get("/healthy", c => c.json({ status: "Healthy" }))

configureOpenAPI(app)

const routes: AppOpenApi[] = [authRouter, accountsRouter, locationsRouter]

routes.forEach(route => {
  app.route("/", route)
})

export default app
