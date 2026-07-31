import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  decimal,
  smallint,
  snakeCase,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

import { timestamps, uuidPk, uuidRef } from "./_shared"

const _commonFields = {
  postcode: varchar({ length: 20 }).notNull(),
  wkt: text().notNull(),

  isActive: boolean().notNull(),

  ...timestamps,
}

// ? ───────────────── Zones Table ─────────────────
export const zonesTable = snakeCase.table(
  "zones",
  {
    // Required
    id: uuidPk(),

    rate: decimal().notNull(),

    name: varchar({ length: 255 }).unique().notNull(),

    ..._commonFields,
  },

  table => [
    // ? ───────────────── Checks ─────────────────
    check("zone_rate_positive", sql`${table.rate} > 0`),
  ]
)

// ? ───────────────── Zones Schemas ─────────────────
// here will be schemas for the zones table

// ? ───────────────── Streets Table ─────────────────
export const streetsTable = snakeCase.table(
  "streets",
  {
    // Required
    id: uuidPk(),

    zoneId: uuidRef(() => zonesTable.id),

    streetNumber: smallint().notNull(),

    name: varchar({ length: 255 }).notNull(),

    ..._commonFields,
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    uniqueIndex("street_name_per_zone_idx").on(table.zoneId, table.name),

    // ? ───────────────── Checks ─────────────────
    check("street_number_positive", sql`${table.streetNumber} > 0`),
  ]
)

// ? ───────────────── Streets Schemas ─────────────────
// here will be schemas for the streets table
