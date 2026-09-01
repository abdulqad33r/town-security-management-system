import { date, index, snakeCase, varchar } from "drizzle-orm/pg-core"

import { timestamps, uuidPk, uuidRef } from "./_shared"
import { guardProfilesTable } from "./accounts"
import { guardDocTypeEnum } from "./enums"

// ? ───────────────── Guard Documents Table ─────────────────
export const guardDocumentsTable = snakeCase.table(
  "guard_documents",
  {
    // Required
    id: uuidPk(),

    guardId: uuidRef(() => guardProfilesTable.accountId, {
      onDelete: "cascade",
    }),

    docType: guardDocTypeEnum().notNull(),

    fileUrl: varchar().notNull(),

    uploadedAt: timestamps().createdAt,

    // Nullable
    expiryDate: date(),
  },

  table => [
    // ? ───────────────── Indexes ─────────────────
    index("guard_documents_guard_id_idx").on(table.guardId),
  ]
)

// ? ───────────────── Guard Documents Schemas ─────────────────
// here will be schemas for the guard documents table
