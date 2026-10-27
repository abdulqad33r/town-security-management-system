import db from "@/db"
import { zonesTable } from "@/db/schema"
import type { AddZoneInput } from "@/validators/locations.validators"

export const findZoneByName = (name: string) =>
  db.query.zonesTable.findFirst({ where: { name } })

export const createZone = (data: AddZoneInput) =>
  db
    .insert(zonesTable)
    .values(data)
    .returning()
    .then(rows => rows[0])
