import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  serial,
  smallint,
  snakeCase,
  time,
} from "drizzle-orm/pg-core"

import { timestamps } from "./_shared"

// ? ───────────────── Shifts Table ─────────────────
export const shiftsTable = snakeCase.table(
  "shifts",
  {
    // Required
    id: serial().primaryKey(),

    shiftNo: smallint().notNull(),

    startTime: time().notNull(),
    endTime: time().notNull(),

    isCurrent: boolean().notNull(),

    createdAt: timestamps().createdAt,
  },

  table => [
    // ? ───────────────── Checks ─────────────────
    check("shift_no_positive_check", sql`${table.shiftNo} > 0`),

    check("shift_time_check", sql`${table.endTime} > ${table.startTime}`),
  ]
)

// ? ───────────────── Shifts Schemas ─────────────────
// here will be schemas for the shifts table
