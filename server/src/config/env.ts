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
    REDIS_URL: z.string().default("redis://localhost:6379"),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(30),

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
