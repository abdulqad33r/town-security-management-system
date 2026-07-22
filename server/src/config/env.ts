import "dotenv/config"
import z from "zod"

const NODE_ENVS = ["development", "production", "test"] as const
const LOG_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
  "silent",
] as const

const parsedEnv = z
  .object({
    DB_URL: z.string(),

    LOG_LEVEL: z.enum(LOG_LEVELS).default("debug"),

    NODE_ENV: z.enum(NODE_ENVS).default("development"),

    PORT: z.coerce.number().int().positive().max(65535).default(3000),
  })
  .safeParse(process.env)

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables")
  console.error(z.treeifyError(parsedEnv.error).properties)
  process.exit(1)
}

const env = parsedEnv.data

export const isDevEnv = env.NODE_ENV === "development"

export default env
