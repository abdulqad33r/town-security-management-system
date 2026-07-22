import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  index,
  numeric,
  smallint,
  snakeCase,
  time,
  varchar,
} from "drizzle-orm/pg-core"

import { serialRef, timestamps, uuidPk, uuidRef } from "./_shared"
import { guardProfilesTable, managerProfilesTable } from "./accounts"
import { workStatusEnum } from "./enums"
import { zonesTable } from "./location"
import { shiftsTable } from "./shifts"

// ? ───────────────── Guard Schedules Table ─────────────────
export const guardSchedulesTable = snakeCase.table(
  "guard_schedules",
  {
    // Required
    id: uuidPk(),
    guardId: uuidRef(() => guardProfilesTable.accountId),

    isManual: boolean().notNull(),

    weekStartDate: date().notNull(),

    shiftDate: date().notNull(),

    shiftId: serialRef(() => shiftsTable.id),

    shiftNo: smallint().notNull(),

    shiftStartTime: time().notNull(),
    shiftEndTime: time().notNull(),

    zoneId: uuidRef(() => zonesTable.id),

    rate: numeric({ precision: 10, scale: 2 }).notNull(),

    status: workStatusEnum().notNull(),

    assignedById: uuidRef(() => managerProfilesTable.accountId),

    ...timestamps,

    // Nullable
    notes: varchar({ length: 255 }),
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("guard_schedules_guard_id_idx").on(table.guardId),
    index("guard_schedules_zone_id_idx").on(table.zoneId),
    index("guard_schedules_shift_date_idx").on(table.shiftDate),
    index("guard_schedules_status_idx").on(table.status),
  ]
)

// ? ───────────────── Guard Schedules Schemas ─────────────────
// here will be schemas for the guard schedules table

// ? ───────────────── Guard Attendances Table ─────────────────
export const guardAttendancesTable = snakeCase.table(
  "guard_attendances",
  {
    // Required
    guardScheduleId: uuidRef(
      () => guardSchedulesTable.id
    ).primaryKey(),

    checkInAt: time().notNull(),

    breakStartAt: time().notNull(),

    ...timestamps,

    // Nullable
    checkOutAt: time(),

    breakEndAt: time(),

    notes: varchar({ length: 255 }),
  },

  table => [
    // ? ───────────────── Checks ─────────────────
    check(
      "check_in_out_time_check",
      sql`${table.checkInAt} < ${table.checkOutAt}`
    ),

    check(
      "break_time_check",
      sql`${table.breakStartAt} < ${table.breakEndAt}`
    ),
  ]
)

// ? ───────────────── Guard Attendances Schemas ─────────────────
// here will be schemas for the guard attendances table
