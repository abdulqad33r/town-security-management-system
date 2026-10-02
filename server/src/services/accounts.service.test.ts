import { beforeEach, describe, expect, it, mock } from "bun:test"

import type z from "zod"

import { HttpStatus } from "@/constants/httpStatus"
import type { getMeSchema } from "@/db/schema"
import type { Prettify } from "@/types"
import type { NonPendingApprovalStatus } from "@/types/auth.types"

// ─────────────────────────────────────────────
// Fakes + factories
// ─────────────────────────────────────────────
const deleteAllSessions = mock(async () => {})

mock.module("@/redis/session.store", () => ({ deleteAllSessions }))

type Account = z.infer<typeof getMeSchema>
type UpdatedAccount = Prettify<
  Omit<Account, "approvalStatus"> & {
    approvalStatus: NonPendingApprovalStatus
  }
>

const accountsById = new Map<string, Account>()

let deleteAccountBeforeUpdate = false

mock.module("@/repositories/account.repository", () => ({
  findAccountByEmail: async () => {},
  findAccountById: async (id: string) => accountsById.get(id) ?? null,
  updateApprovalStatus: async (
    id: string,
    newApprovalStatus: NonPendingApprovalStatus
  ): Promise<UpdatedAccount | undefined> => {
    if (deleteAccountBeforeUpdate) {
      accountsById.delete(id)
      return undefined
    }

    const account = accountsById.get(id)
    if (account) account.approvalStatus = newApprovalStatus

    return account as UpdatedAccount | undefined
  },
  createAccount: async () => {},
}))

function resetFakes() {
  accountsById.clear()
  deleteAccountBeforeUpdate = false
  deleteAllSessions.mockClear()
}

const { updateAccountStatus } = await import("./accounts.service")

/** Registers an account under both lookup maps and returns it. */
function makeAccount(overrides: Partial<Account> = {}) {
  const account: Account = {
    id: crypto.randomUUID(),
    role: "resident",
    approvalStatus: "approved",
    ...overrides,
  }

  accountsById.set(account.id, account)
  return account
}

// ─────────────────────────────────────────────
// updateAccountStatus()
// ─────────────────────────────────────────────
describe("accounts.service updateAccountStatus()", () => {
  beforeEach(resetFakes)

  it("rejects when the account is not found", async () => {
    await expect(
      updateAccountStatus(crypto.randomUUID(), "approved")
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND })
  })

  it("rejects when new approval status value is the same as current status", async () => {
    const id = crypto.randomUUID()
    const account = makeAccount({ id })

    const transitionErrorObj = {
      status: HttpStatus.BAD_REQUEST,
      message: "Invalid status transition",
    }

    await expect(updateAccountStatus(id, "approved")).rejects.toMatchObject(
      transitionErrorObj
    )

    account.approvalStatus = "suspended"
    await expect(updateAccountStatus(id, "suspended")).rejects.toMatchObject(
      transitionErrorObj
    )
  })

  it("rejects when the account is deleted after the existence check", async () => {
    const id = crypto.randomUUID()
    makeAccount({ id, approvalStatus: "pending" })

    deleteAccountBeforeUpdate = true

    await expect(updateAccountStatus(id, "approved")).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    })
  })

  it("updates pending account to approved", async () => {
    const id = crypto.randomUUID()

    const { role } = makeAccount({ id, approvalStatus: "pending" })

    const result = await updateAccountStatus(id, "approved")

    expect(result).toMatchObject({
      id,
      role,
      approvalStatus: "approved",
    } satisfies UpdatedAccount)

    expect(accountsById.get(id)?.approvalStatus).toBe("approved")
    expect(deleteAllSessions).not.toHaveBeenCalled()
  })

  it("updates approved account to suspended", async () => {
    const id = crypto.randomUUID()

    makeAccount({ id })

    const result = await updateAccountStatus(id, "suspended")

    expect(result.approvalStatus).toBe("suspended")
    expect(deleteAllSessions).toBeCalledWith(id)
  })

  it("updates suspended account to approved", async () => {
    const id = crypto.randomUUID()

    makeAccount({ id, approvalStatus: "suspended" })

    const result = await updateAccountStatus(id, "approved")

    expect(result.approvalStatus).toBe("approved")
    expect(deleteAllSessions).not.toHaveBeenCalled()
  })

  it("rejects pending account to suspended", async () => {
    const id = crypto.randomUUID()

    makeAccount({ id, approvalStatus: "pending" })

    await expect(updateAccountStatus(id, "suspended")).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      message: "Invalid status transition",
    })
  })
})
