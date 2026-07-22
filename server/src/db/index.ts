import { SQL } from "bun"
import { drizzle } from "drizzle-orm/bun-sql/postgres"

import env from "@/config/env"

import { relations } from "./relations"

const client = new SQL(env.DB_URL)

const db = drizzle({ client, relations })

export default db
