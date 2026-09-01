import type { AnyPgColumn } from "drizzle-orm/pg-core"
import { serial, timestamp, uuid } from "drizzle-orm/pg-core"

import { visitStatusEnum } from "./enums"

// export const defaultTimestamp = timestamp({ withTimezone: true })
//   .notNull()
//   .defaultNow()

// export const timestamps = {
//   createdAt: defaultTimestamp,
//   updatedAt: defaultTimestamp.$onUpdate(() => new Date()),
// }

export const timestamps = () => ({
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),

  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const uuidPk = (name?: string) => uuid(name).primaryKey().defaultRandom()

type ReferenceOptions = Parameters<ReturnType<typeof uuid>["references"]>[1]

export const uuidRef = (ref: () => AnyPgColumn, options?: ReferenceOptions) =>
  uuid().references(ref, options).notNull()

export const uuidRefNullable = (
  ref: () => AnyPgColumn,
  options?: ReferenceOptions
) => uuid().references(ref, options)

export const serialRef = (ref: () => AnyPgColumn, options?: ReferenceOptions) =>
  serial().references(ref, options).notNull()

export const visitStatus = (name = "visit_status") =>
  visitStatusEnum(name).default("pending").notNull()
