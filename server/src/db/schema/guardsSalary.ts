import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  index,
  numeric,
  serial,
  smallint,
  snakeCase,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

import { timestamps, uuidPk, uuidRef, uuidRefNullable } from "./_shared"
import { guardProfilesTable, managerProfilesTable } from "./accounts"
import { salaryRequestStatusEnum } from "./enums"
import { guardSchedulesTable } from "./guardsSchedules"

// ? ───────────────── Guard Salary Requests Table ─────────────────
export const guardSalaryRequestsTable = snakeCase.table(
  "guard_salary_requests",
  {
    // Required
    id: uuidPk(),
    guardId: uuidRef(() => guardProfilesTable.accountId),

    periodStartDate: date().notNull(),
    periodEndDate: date().notNull(),

    requestedShiftCount: smallint().notNull(),
    requestedAmount: numeric({ precision: 10, scale: 2 }).notNull(),

    status: salaryRequestStatusEnum().default("pending").notNull(),

    requestedAt: timestamps.createdAt,

    // Nullable
    approvedByManagerId: uuidRefNullable(() => managerProfilesTable.accountId),
    approvedAt: timestamp({ withTimezone: true }),

    notes: varchar({ length: 255 }),
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("guard_salary_requests_guard_id_idx").on(table.guardId),
    index("guard_salary_requests_status_idx").on(table.status),

    // ? ───────────────── Checks ─────────────────
    check(
      "salary_request_period_check",
      sql`${table.periodEndDate} >= ${table.periodStartDate}`
    ),

    check(
      "requested_shift_count_positive_check",
      sql`${table.requestedShiftCount} > 0`
    ),

    check("requested_amount_positive_check", sql`${table.requestedAmount} > 0`),

    check(
      "approval_check",
      sql`
           (
             ${table.status} = 'pending'
             AND ${table.approvedByManagerId} IS NULL
             AND ${table.approvedAt} IS NULL
           )
           OR
           (
             ${table.status} IN ('approved', 'rejected')
             AND ${table.approvedByManagerId} IS NOT NULL
             AND ${table.approvedAt} IS NOT NULL
           )
         `
    ),
  ]
)

// ? ───────────────── Guard Salary Requests Schemas ─────────────────
// here will be schemas for the guard salary requests table

// ? ───────────────── Guard Salary Slips Table ─────────────────
export const guardSalarySlipsTable = snakeCase.table(
  "guard_salary_slips",
  {
    // Required
    id: uuidPk(),
    generatedByManagerId: uuidRef(() => managerProfilesTable.accountId),
    guardId: uuidRef(() => guardProfilesTable.accountId),

    periodStartDate: date().notNull(),
    periodEndDate: date().notNull(),

    totalShifts: smallint().notNull(),
    totalAmount: numeric({ precision: 10, scale: 2 }).notNull(),

    isPaid: boolean().default(false).notNull(),

    ...timestamps,

    // Nullable
    salaryRequestId: uuidRefNullable(
      () => guardSalaryRequestsTable.id
    ).unique(),

    notes: varchar({ length: 255 }),
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("guard_salary_slips_guard_id_idx").on(table.guardId),
    uniqueIndex("guard_salary_slips_salary_request_id_idx").on(
      table.salaryRequestId
    ),

    // ? ───────────────── Checks ─────────────────
    check(
      "salary_slip_period_check",
      sql`${table.periodEndDate} >= ${table.periodStartDate}`
    ),

    check("total_shifts_positive_check", sql`${table.totalShifts} > 0`),

    check("total_amount_positive_check", sql`${table.totalAmount} > 0`),
  ]
)

// ? ───────────────── Guard Salary Slip Items Schemas ─────────────────
// here will be schemas for the guard salary slip items table

// ? ───────────────── Guard Salary Slips Table ─────────────────
export const guardSalarySlipItemsTable = snakeCase.table(
  "guard_salary_slip_items",
  {
    // Required
    id: serial().primaryKey(),

    salarySlipId: uuidRef(() => guardSalarySlipsTable.id),
    guardScheduleId: uuidRef(() => guardSchedulesTable.id),

    amount: numeric({ precision: 10, scale: 2 }).notNull(),

    isPaid: boolean().default(false).notNull(),

    createdAt: timestamps.createdAt,
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("guard_salary_slip_items_salary_slip_id_idx").on(table.salarySlipId),
    index("guard_salary_slip_items_guard_schedule_id_idx").on(
      table.guardScheduleId
    ),

    // ? ───────────────── Checks ─────────────────
    check("amount_positive_check", sql`${table.amount} > 0`),
  ]
)

// ? ───────────────── Guard Salary Slip Items Schemas ─────────────────
// here will be schemas for the guard salary slip items table
