import { HttpStatus } from "@/constants/httpStatus"
import type { ApprovalStatus } from "@/db/schema"
import { appAssert } from "@/lib/errors/httpErrors"
import { deleteAllSessions } from "@/redis/session.store"
import {
  findAccountById,
  updateApprovalStatus,
} from "@/repositories/account.repository"
import type { NonPendingApprovalStatus } from "@/types/auth.types"
import { pickFields } from "@/utils/object"

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
