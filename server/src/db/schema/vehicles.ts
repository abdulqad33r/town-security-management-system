import { sql } from "drizzle-orm"
import {
  check,
  date,
  index,
  numeric,
  snakeCase,
  varchar,
} from "drizzle-orm/pg-core"

import { timestamps, uuidPk, uuidRef, uuidRefNullable } from "./_shared"
import { accountsTable } from "./accounts"
import {
  vehicleDocTypeEnum,
  vehicleOwnerTypeEnum,
  vehicleTypeEnum,
} from "./enums"
import { housesTable } from "./houses"

// ? ───────────────── Vehicles Table ─────────────────
export const vehiclesTable = snakeCase.table(
  "vehicles",
  {
    // Required
    id: uuidPk(),

    ownerId: uuidRef(() => accountsTable.id),
    ownerType: vehicleOwnerTypeEnum().notNull(),

    vehicleType: vehicleTypeEnum().notNull(),

    make: varchar({ length: 50 }).notNull(),
    model: varchar({ length: 50 }).notNull(),
    registrationNumber: varchar({ length: 20 }).notNull(),

    imageUrl: varchar({ length: 255 }).notNull(),

    ...timestamps(),

    // Nullable
    houseId: uuidRefNullable(() => housesTable.id),

    parkingPostCode: varchar({ length: 10 }),
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("vehicles_owner_id_idx").on(table.ownerId),
    index("vehicles_house_id_idx").on(table.houseId),

    // ? ───────────────── Checks ─────────────────
    check(
      "vehicles_house_id_check",
      sql`
          (
            ${table.ownerType} = 'resident'
            AND ${table.houseId} IS NOT NULL
          )
          OR
          (
            ${table.ownerType} = 'company'
            AND ${table.houseId} IS NULL
          )
        `
    ),
  ]
)

// ? ───────────────── Vehicles Schemas ─────────────────
// here will be schemas for the vehicles table

// ? ───────────────── Vehicle Documents Table ─────────────────
export const vehicleDocumentsTable = snakeCase.table(
  "vehicle_documents",
  {
    // Required
    id: uuidPk(),

    vehicleId: uuidRef(() => vehiclesTable.id, {
      onDelete: "cascade",
    }),

    documentType: vehicleDocTypeEnum().notNull(),
    documentDate: date().notNull(),

    fileUrl: varchar({ length: 255 }).notNull(),

    uploadedAt: timestamps().createdAt,

    // Nullable
    fuelPrice: numeric(),

    notes: varchar({ length: 255 }),
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("vehicle_documents_vehicle_id_idx").on(table.vehicleId),

    // ? ───────────────── Checks ─────────────────
    // fuel_price is only allowed when document_type is petrol_slip
    check(
      "fuel_price_only_for_petrol_slip",
      sql`
        (
          ${table.documentType} = 'petrol_slip'
          AND ${table.fuelPrice} IS NOT NULL
        )
        OR
        (
          ${table.documentType} <> 'petrol_slip'
          AND ${table.fuelPrice} IS NULL
        )
      `
    ),
  ]
)

// ? ───────────────── Vehicle Documents Schemas ─────────────────
// here will be schemas for the vehicles table
