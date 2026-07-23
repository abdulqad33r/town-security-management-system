import { RedisClient } from "bun"

import env from "@/config/env"

const redis = new RedisClient(env.REDIS_URL)

export default redis
