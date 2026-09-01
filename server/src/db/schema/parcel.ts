import { sql } from "drizzle-orm"
import {
  check,
  index,
  smallint,
  snakeCase,
  text,
  varchar,
} from "drizzle-orm/pg-core"

import { timestamps, uuidPk, uuidRef } from "./_shared"
import { guardProfilesTable, houseMembersTable } from "./accounts"
import { parcelStatusEnum } from "./enums"
import { housesTable } from "./houses"

// ? ───────────────── Guest Parcel Collections Table ─────────────────
export const parcelCollectionsTable = snakeCase.table(
  "parcel_collections",
  {
    // Required
    id: uuidPk(),

    collectedByGuardId: uuidRef(() => guardProfilesTable.accountId),

    houseId: uuidRef(() => housesTable.id),
    receivedForMemberId: uuidRef(() => houseMembersTable.accountId),

    parcelCount: smallint().notNull(),

    description: text(),

    photoUrl: varchar().notNull(),

    status: parcelStatusEnum().default("collected").notNull(),

    collectedAt: timestamps().createdAt,
    updatedAt: timestamps().updatedAt,
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("parcel_collections_collected_by_guard_id_idx").on(
      table.collectedByGuardId
    ),
    index("parcel_collections_house_id_idx").on(table.houseId),
    index("parcel_collections_received_for_member_id_idx").on(
      table.receivedForMemberId
    ),

    // ? ───────────────── Checks ─────────────────
    check("parcel_count_positive", sql`${table.parcelCount} > 0`),
  ]
)

// ? ───────────────── Guest Parcel Collections Schema ─────────────────
// here will be schemas for the guard parcel collections table
