import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  integer,
  snakeCase,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

import { timestamps, uuidPk, uuidRef } from "./_shared"
import { streetsTable, zonesTable } from "./location"

// ? ───────────────── Houses Table ─────────────────
export const housesTable = snakeCase.table(
  "houses",
  {
    // Required
    id: uuidPk(),

    zoneId: uuidRef(() => zonesTable.id),
    streetId: uuidRef(() => streetsTable.id),

    houseNumber: integer().notNull(),
    houseName: varchar({ length: 255 }).notNull(),

    isActive: boolean().notNull(),

    ...timestamps(),
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("houses_zone_id_idx").on(table.zoneId),
    index("houses_street_id_idx").on(table.streetId),

    // two houses can't share a number on one street
    uniqueIndex("houses_street_house_number_uniq").on(
      table.streetId,
      table.houseNumber
    ),

    // ? ───────────────── Checks ─────────────────
    check("house_number_positive", sql`${table.houseNumber} > 0`),
  ]
)

// ? ───────────────── Houses Schemas ─────────────────
// here will be schemas for the houses table
