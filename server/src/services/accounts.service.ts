import { and, count, eq } from "drizzle-orm"

import { HttpStatus } from "@/constants/httpStatus"
import db from "@/db"
import type { ApprovalStatus } from "@/db/schema"
import { accountsTable } from "@/db/schema"
import { appAssert } from "@/lib/errors/httpErrors"
import { deleteAllSessions } from "@/redis/session.store"
import {
  findAccountById,
  updateApprovalStatus,
} from "@/repositories/account.repository"
import type { NonPendingApprovalStatus } from "@/types/auth.types"
import { omitFields, pickFields } from "@/utils/object"
import type {
  ListAccountsQuery,
  ListAccountsResponse,
} from "@/validators/accounts.validators"

// ? ───────────────── Update Account Status ─────────────────
const allowedStatusTransitions: Record<
  ApprovalStatus,
  readonly NonPendingApprovalStatus[]
> = {
  pending: ["approved"],
  approved: ["suspended"],
  suspended: ["approved"],
}

export async function updateAccountStatus(
  id: string,
  approvalStatus: NonPendingApprovalStatus
) {
  const account = await findAccountById(id)
  appAssert(account, HttpStatus.NOT_FOUND, "Account not found")

  const allowedStatuses = allowedStatusTransitions[account.approvalStatus]

  appAssert(
    allowedStatuses.includes(approvalStatus),
    HttpStatus.BAD_REQUEST,
    "Invalid status transition"
  )

  const updated = await updateApprovalStatus(id, approvalStatus)

  // This assertion is for unlikely scenario when the user deleted his account right before the update of the status but after the check if the account exists
  appAssert(updated, HttpStatus.NOT_FOUND, "Account not found")

  if (approvalStatus !== "approved") await deleteAllSessions(updated.id)

  return pickFields(updated, ["id", "role", "approvalStatus"])
}

// ? ───────────────── Get an Account ─────────────────
export async function getAccount(id: string) {
  const account = await findAccountById(id)
  appAssert(account, HttpStatus.NOT_FOUND, "Account not found")

  return omitFields(account, ["passwordHash"])
}

// ? ───────────────── List Accounts ─────────────────
export async function listAccounts({
  approvalStatus,
  role,
  page,
  limit,
}: ListAccountsQuery): Promise<ListAccountsResponse> {
  const where = {
    ...(approvalStatus ? { approvalStatus } : {}),
    ...(role ? { role } : {}),
  }

  const conditions = [
    approvalStatus
      ? eq(accountsTable.approvalStatus, approvalStatus)
      : undefined,
    role ? eq(accountsTable.role, role) : undefined,
  ]

  const [accounts, total] = await Promise.all([
    db.query.accountsTable.findMany({
      where,
      offset: (page - 1) * limit,
      limit,
      orderBy: { createdAt: "desc", id: "asc" },
      columns: { passwordHash: false },
    }),

    db
      .select({ total: count() })
      .from(accountsTable)
      .where(and(...conditions))
      .then(rows => rows[0].total),
  ])

  return {
    accounts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}
