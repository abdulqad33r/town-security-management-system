import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  index,
  snakeCase,
  varchar,
} from "drizzle-orm/pg-core"

import { timestamps, uuidPk, uuidRef } from "./_shared"
import { accountRoleEnum, approvalStatusEnum, genderEnum } from "./enums"
import { housesTable } from "./houses"

// ? ───────────────── Accounts Table ─────────────────
export const accountsTable = snakeCase.table("accounts", {
  // Required
  id: uuidPk(),

  role: accountRoleEnum().notNull(),

  firstName: varchar({ length: 50 }).notNull(),
  lastName: varchar({ length: 50 }).notNull(),

  email: varchar().unique().notNull(),
  phone: varchar({ length: 20 }).notNull(),

  passwordHash: varchar({ length: 255 }).notNull(),

  approvalStatus: approvalStatusEnum().default("pending").notNull(),

  ...timestamps,
})

// ? ───────────────── Accounts Schemas ─────────────────
// here will be schemas for the accounts table

// ? ───────────────── Manager Profiles Table ─────────────────
export const managerProfilesTable = snakeCase.table("manager_profiles", {
  // Required
  accountId: uuidRef(() => accountsTable.id).primaryKey(),

  ...timestamps,
})

// ? ───────────────── Manager Profiles Schemas ─────────────────
// here will be schemas for the manager profiles table

// ? ───────────────── Guard Profiles Table ─────────────────
export const guardProfilesTable = snakeCase.table("guard_profiles", {
  // Required
  accountId: uuidRef(() => accountsTable.id).primaryKey(),

  employeeCode: varchar({ length: 20 }).unique().notNull(),

  dateOfBirth: date().notNull(),

  homeAddress: varchar({ length: 255 }).notNull(),
  emergencyContact: varchar({ length: 20 }).notNull(),

  bankName: varchar({ length: 255 }).notNull(),
  bankAccountNumber: varchar({ length: 20 }).notNull(),
  bankSortCode: varchar({ length: 6 }).notNull(),

  workExperience: varchar({ length: 255 }).notNull(),

  ...timestamps,
})

// ? ───────────────── Guard Profiles Schemas ─────────────────
// here will be schemas for the guard profiles table

// ? ───────────────── House Members Table ─────────────────
export const houseMembersTable = snakeCase.table(
  "house_members",
  {
    // Required
    accountId: uuidRef(() => accountsTable.id).primaryKey(),

    houseId: uuidRef(() => housesTable.id),

    isPrimaryResident: boolean().notNull(),

    dateOfBirth: date().notNull(),

    gender: genderEnum().notNull(),

    whatsappNumber: varchar({ length: 20 }).notNull(),

    ...timestamps,

    // Nullable
    emergencyContact: varchar({ length: 20 }),
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("house_members_house_id_idx").on(table.houseId),

    // ? ───────────────── Checks ─────────────────
    check("date_of_birth_check", sql`${table.dateOfBirth} < CURRENT_DATE`),

    // check(
    //   "date_of_birth_reasonable_check",
    //   sql`${table.dateOfBirth} >= CURRENT_DATE - INTERVAL '130 years'`
    // ),
  ]
)

// ? ───────────────── House Members Schemas ─────────────────
// here will be schemas for the house members table
