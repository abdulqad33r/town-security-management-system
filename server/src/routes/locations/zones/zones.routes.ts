import { createRoute as route } from "@hono/zod-openapi"

import { HttpStatus } from "@/constants/httpStatus"
import { createZoneSchema, zonesSchema } from "@/db/schema"
import { jsonContentRequired, jsonContentWithData } from "@/lib/openapi"
import {
  errorResponse,
  validationErrorResponse,
} from "@/lib/openapi/schemas/responseSchemas"

import { writeAccess } from "../locations.middleware"

export const tags = ["locations"] as const satisfies string[]

export const addZone = route({
  path: "/zones",
  method: "post",
  tags,
  middleware: writeAccess,
  request: { body: jsonContentRequired(createZoneSchema, "New zone") },
  responses: {
    [HttpStatus.CREATED]: jsonContentWithData(zonesSchema, "Zone created"),

    ...errorResponse(HttpStatus.CONFLICT, "Zone already exists"),
    ...validationErrorResponse([createZoneSchema]),
  },
})

export type AddZone = typeof addZone
