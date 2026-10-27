import { HttpStatus } from "@/constants/httpStatus"
import { success } from "@/lib/success"
import type { AppRouteHandler } from "@/lib/types"
import * as zonesService from "@/services/locations/zones.service"
import type { AddZoneInput } from "@/validators/locations.validators"

import type { AddZone } from "./zones.routes"

export const addZone: AppRouteHandler<AddZone> = async c => {
  const body = c.req.valid("json") satisfies AddZoneInput
  const zone = await zonesService.addZone(body)

  return c.json(success(zone), HttpStatus.CREATED)
}
