import type { z } from "@hono/zod-openapi"

import type { createZoneSchema } from "@/db/schema"

export type AddZoneInput = z.infer<typeof createZoneSchema>
