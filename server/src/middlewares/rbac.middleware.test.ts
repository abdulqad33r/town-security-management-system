import { beforeEach, describe, expect, it, mock } from "bun:test"

import { PERMISSIONS } from "@/constants/permissions"
import type { UserRole } from "@/db/schema"

import requirePermission from "./rbac.middleware"

function makeContext(role: UserRole) {
  return {
    get: (key: string) => (key === "role" ? role : undefined),
  } as any
}

let next: ReturnType<typeof mock>

describe("requirePermission", () => {
  beforeEach(() => {
    next = mock(() => Promise.resolve())
  })

  it("calls next() when the manager role has the required permission", async () => {
    const c = makeContext("manager")

    await requirePermission(PERMISSIONS.GUARD_MANAGE)(c, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it("calls next() when the guard role has the required permission", async () => {
    const c = makeContext("guard")

    await requirePermission(PERMISSIONS.TOWN_VIEW)(c, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it("calls next() when the resident role has the required permission", async () => {
    const c = makeContext("resident")

    await requirePermission(PERMISSIONS.ACCOUNT_MANAGE_OWN)(c, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it("rejects when the resident role doesn't have the required permission", async () => {
    const c = makeContext("resident")

    await expect(
      requirePermission(PERMISSIONS.GUARD_MANAGE)(c, next)
    ).rejects.toThrow()

    expect(next).not.toHaveBeenCalled()
  })

  it("rejects when the guard role doesn't have the required permission", async () => {
    const c = makeContext("guard")

    await expect(
      requirePermission(PERMISSIONS.ACCOUNT_APPROVE)(c, next)
    ).rejects.toThrow()

    expect(next).not.toHaveBeenCalled()
  })
})
