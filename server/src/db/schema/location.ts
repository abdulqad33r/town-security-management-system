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
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod"
import z from "zod"

import { compact } from "@/utils/zod"

import { timestamps, uuidPk, uuidRef } from "./_shared"

const _commonFields = {
  postcode: varchar({ length: 20 }).notNull(),
  wkt: text().notNull(),

  isActive: boolean().notNull().default(true),

  ...timestamps(),
}

export const ZONES_NAME_LOWER_IDX = "zones_name_lower_idx"

// ? ───────────────── Zones Table ─────────────────
export const zonesTable = snakeCase.table(
  "zones",
  {
    // Required
    id: uuidPk(),

    rate: decimal({ precision: 10, scale: 2, mode: "number" }).notNull(),

    name: varchar({ length: 255 }).notNull(),

    ..._commonFields,
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    uniqueIndex(ZONES_NAME_LOWER_IDX).on(sql`lower(${table.name})`),

    // ? ───────────────── Checks ─────────────────
    check("zone_rate_positive", sql`${table.rate} > 0`),
  ]
)

// ? ───────────────── Zones Schemas ─────────────────
export const zonesSchema = compact(createSelectSchema(zonesTable))
export const createZoneSchema = compact(
  createInsertSchema(zonesTable, {
    name: schema => schema.trim().min(1, "Name is required"),
    rate: () => z.number().gt(0),
    wkt: schema =>
      schema
        .trim()
        .regex(/^(POINT|POLYGON|MULTIPOLYGON)\s*\(/i, "Must be valid WKT"),
    postcode: schema => schema.trim().min(2).max(20),
  }).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
)

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
