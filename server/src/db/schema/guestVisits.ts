import { sql } from "drizzle-orm"
import {
  check,
  index,
  smallint,
  snakeCase,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

import {
  timestamps,
  uuidPk,
  uuidRef,
  uuidRefNullable,
  visitStatus,
} from "./_shared"
import {
  accountsTable,
  guardProfilesTable,
  houseMembersTable,
} from "./accounts"
import { approvalDecisionEnum, arrivalModeEnum, vehicleTypeEnum } from "./enums"
import { housesTable } from "./houses"
import { streetsTable, zonesTable } from "./location"

// ? ───────────────── Guest Visits Table ─────────────────
export const guestVisitsTable = snakeCase.table(
  "guest_visits",
  {
    // Required
    id: uuidPk(),

    recordedByGuardAccountId: uuidRef(() => guardProfilesTable.accountId),

    hostHouseId: uuidRef(() => housesTable.id),
    hostMemberId: uuidRef(() => houseMembersTable.accountId),

    zoneId: uuidRef(() => zonesTable.id),
    streetId: uuidRef(() => streetsTable.id),

    guestName: varchar({ length: 255 }).notNull(),
    guestCount: smallint().notNull(),

    arrivalMode: arrivalModeEnum().notNull(),

    arrivedAt: timestamp().notNull(),

    status: visitStatus().default("pending").notNull(),

    ...timestamps,

    // Nullable
    vehicleType: vehicleTypeEnum(),
    vehicleRegistration: varchar({ length: 20 }),

    purpose: varchar({ length: 255 }),

    departedAt: timestamp(),

    notes: varchar({ length: 255 }),
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("guest_visits_recorded_by_guard_idx").on(
      table.recordedByGuardAccountId
    ),
    index("guest_visits_host_house_id_idx").on(table.hostHouseId),
    index("guest_visits_zone_id_idx").on(table.zoneId),
    index("guest_visits_street_id_idx").on(table.streetId),
    index("guest_visits_status_idx").on(table.status),

    // ? ───────────────── Checks ─────────────────
    check("guest_count_positive_check", sql`${table.guestCount} > 0`),

    check(
      "vehicle_type_vehicle_registration_check",
      sql`
        (
          ${table.vehicleType} IS NOT NULL
          AND ${table.vehicleRegistration} IS NOT NULL
        )
        OR
        (
          ${table.vehicleType} IS NULL
          AND ${table.vehicleRegistration} IS NULL
        )
        `
    ),
    check(
      "departed_at_after_arrived_at_check",
      sql`
        ${table.departedAt} IS NULL
        OR ${table.departedAt} >= ${table.arrivedAt}
      `
    ),
    check(
      "arrival_mode_vehicle_fields_check",
      sql`
        (
          ${table.arrivalMode} = 'vehicle'
          AND ${table.vehicleType} IS NOT NULL
          AND ${table.vehicleRegistration} IS NOT NULL
        )
        OR
        (
          ${table.arrivalMode} <> 'vehicle'
          AND ${table.vehicleType} IS NULL
          AND ${table.vehicleRegistration} IS NULL
        )
      `
    ),
  ]
)

// ? ───────────────── Guest Visits Schema ─────────────────
// here will be schemas for the guest visits table

// ? ───────────────── Guest Visit Approvals Table ─────────────────
export const guestVisitApprovalsTable = snakeCase.table(
  "guest_visit_approvals",
  {
    // Required
    guestVisitId: uuidRef(() => guestVisitsTable.id, {
      onDelete: "cascade",
    }).primaryKey(),

    decision: approvalDecisionEnum().default("pending").notNull(),

    // Nullable
    decidedByAccountId: uuidRefNullable(() => accountsTable.id),
    decidedAt: timestamp(),

    notes: varchar({ length: 255 }),
  }
)

// ? ───────────────── Guest Visit Approvals Schema ─────────────────
// here will be schemas for the guest visit approvals table
