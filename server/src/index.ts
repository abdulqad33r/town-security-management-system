import { serve } from "bun"

import app from "./app"
import env, { isDevEnv } from "./config/env"

serve({
  fetch: app.fetch,
  port: env.PORT,
  development: isDevEnv,
})

export default app
