import { HttpStatus } from "@/constants/httpStatus"
import { ZONES_NAME_LOWER_IDX } from "@/db/schema"
import { isUniqueViolation } from "@/lib/errors/dbErrors"
import { throwError } from "@/lib/errors/httpErrors"
import { createZone } from "@/repositories/locations.repository"
import type { AddZoneInput } from "@/validators/locations.validators"

// ? ───────────────── Add Zone ─────────────────
export async function addZone(input: AddZoneInput) {
  try {
    return await createZone(input)
  } catch (error) {
    if (isUniqueViolation(error, ZONES_NAME_LOWER_IDX))
      throwError(HttpStatus.CONFLICT, "Zone already exists")

    throw error
  }
}
