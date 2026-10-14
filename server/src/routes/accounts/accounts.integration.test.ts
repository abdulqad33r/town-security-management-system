import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import app from "@/app"
import { HttpStatus } from "@/constants/httpStatus"
import { resetDb, seedAccount, seedManager } from "@/test/helpers/db"
import type { ListAccountsResponse } from "@/validators/accounts.validators"

// type ListedAccount = ListAccountsResponse

async function login(email: string, password: string) {
  const res = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  expect(res.status).toBe(HttpStatus.OK)

  const { data } = (await res.json()) as { data: { accessToken: string } }
  return data.accessToken
}

const get = (path: string, token?: string) =>
  app.request(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

const day = (n: number) => new Date(Date.UTC(2026, 0, n))

describe("GET /accounts (integration)", () => {
  let managerToken: string

  beforeEach(async () => {
    await resetDb()

    const { manager, password } = await seedManager()
    managerToken = await login(manager.email, password)
  })

  afterEach(resetDb)

  const list = async (query = "") => {
    const res = await get(`/accounts${query}`, managerToken)
    return {
      res,
      body: (await res.json()) as { data: ListAccountsResponse },
    }
  }

  const emails = (body: { data: ListAccountsResponse }) =>
    body.data.accounts.map(a => a.email)

  // ─────────────────────────────────────────────
  // Access control
  // ─────────────────────────────────────────────
  describe("access control", () => {
    it("rejects a request with no token", async () => {
      const res = await get("/accounts")

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED)
    })

    it("rejects an approved resident", async () => {
      const { account, password } = await seedAccount({ role: "resident" })
      const residentToken = await login(account.email, password)

      const res = await get("/accounts", residentToken)

      expect(res.status).toBe(HttpStatus.FORBIDDEN)
    })
  })

  // ─────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────
  describe("filtering", () => {
    it("returns only pending accounts for ?approvalStatus=pending", async () => {
      await seedAccount({ approvalStatus: "pending", role: "resident" })
      await seedAccount({ approvalStatus: "pending", role: "guard" })
      await seedAccount({ approvalStatus: "approved", role: "resident" })
      await seedAccount({ approvalStatus: "suspended", role: "guard" })

      const { res, body } = await list("?approvalStatus=pending")

      expect(res.status).toBe(HttpStatus.OK)
      expect(
        body.data.accounts.every(a => a.approvalStatus === "pending")
      ).toBe(true)
      expect(body.data.pagination.total).toBe(2)
    })

    it("applies approvalStatus and role together", async () => {
      const { account: approvedResident } = await seedAccount({
        approvalStatus: "approved",
        role: "resident",
      })
      await seedAccount({ approvalStatus: "approved", role: "guard" })
      await seedAccount({ approvalStatus: "pending", role: "resident" })

      const { body } = await list("?approvalStatus=approved&role=resident")

      expect(emails(body)).toEqual([approvedResident.email])
      expect(body.data.pagination.total).toBe(1)
    })

    it("returns an empty list, not an error, when nothing matches", async () => {
      await seedAccount({ approvalStatus: "approved" })

      const { res, body } = await list("?approvalStatus=suspended")

      expect(res.status).toBe(HttpStatus.OK)
      expect(body.data.accounts).toEqual([])
      expect(body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      })
    })
  })

  // ─────────────────────────────────────────────
  // Ordering and pagination
  // ─────────────────────────────────────────────
  describe("ordering and pagination", () => {
    beforeEach(async () => {
      await seedAccount({
        email: "oldest@example.com",
        approvalStatus: "pending",
        createdAt: day(1),
      })
      await seedAccount({
        email: "middle@example.com",
        approvalStatus: "pending",
        createdAt: day(2),
      })
      await seedAccount({
        email: "newest@example.com",
        approvalStatus: "pending",
        createdAt: day(3),
      })
    })

    it("returns newest first", async () => {
      const { body } = await list("?approvalStatus=pending")

      expect(emails(body)).toEqual([
        "newest@example.com",
        "middle@example.com",
        "oldest@example.com",
      ])
    })

    it("walks the pages in order with limit=1", async () => {
      const page1 = await list("?approvalStatus=pending&limit=1&page=1")
      const page2 = await list("?approvalStatus=pending&limit=1&page=2")
      const page3 = await list("?approvalStatus=pending&limit=1&page=3")

      expect(emails(page1.body)).toEqual(["newest@example.com"])
      expect(emails(page2.body)).toEqual(["middle@example.com"])
      expect(emails(page3.body)).toEqual(["oldest@example.com"])

      expect(page2.body.data.pagination).toEqual({
        page: 2,
        limit: 1,
        total: 3,
        totalPages: 3,
      })
    })

    it("returns an empty page, with the real total, past the last page", async () => {
      const { res, body } = await list("?approvalStatus=pending&limit=1&page=4")

      expect(res.status).toBe(HttpStatus.OK)
      expect(body.data.accounts).toEqual([])
      expect(body.data.pagination.total).toBe(3)
    })
  })

  // ─────────────────────────────────────────────
  // Response shape
  // ─────────────────────────────────────────────
  it("never returns the password hash", async () => {
    await seedAccount({ role: "guard" })

    const { body } = await list()

    expect(body.data.accounts.length).toBeGreaterThan(0)
    for (const account of body.data.accounts)
      expect(account).not.toHaveProperty("passwordHash")
  })

  // ─────────────────────────────────────────────
  // Query validation
  // ─────────────────────────────────────────────
  it.each([
    "?page=0",
    "?page=-1",
    "?page=1.5",
    "?limit=0",
    "?limit=101",
    "?approvalStatus=declined",
    "?role=superuser",
  ])("rejects invalid query %s with a 422", async query => {
    const { res, body } = await list(query)

    expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
    expect(body).toMatchObject({ success: false, type: "VALIDATION_ERROR" })
  })
})
