type PostgresError = { code?: unknown; errno?: unknown; constraint?: unknown }

export function isUniqueViolation(
  error: unknown,
  constraint?: string
): boolean {
  // Drizzle wraps the real Postgres error in `.cause`, so check both levels
  const candidates = [error, (error as { cause?: unknown } | null)?.cause]

  return candidates.some(candidate => {
    const e = candidate as PostgresError | null | undefined
    const isUnique = e?.errno === "23505" || e?.code === "23505"

    return isUnique && (!constraint || e?.constraint === constraint)
  })
}

// cause:
//   PostgresError: duplicate key value violates unique constraint "zones_name_key"
//         errno: "23505",
//        detail: "Key (name)=(abc) already exists.",
//      severity: "ERROR",
//        schema: "public",
//         table: "zones",
//    constraint: "zones_name_key",
//          file: "nbtinsert.c",
//       routine: "_bt_check_unique",
//          code: "ERR_POSTGRES_SERVER_ERROR"
