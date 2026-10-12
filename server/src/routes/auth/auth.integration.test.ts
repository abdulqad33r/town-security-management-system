import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { eq } from "drizzle-orm"

import app from "@/app"
import { HttpStatus } from "@/constants/httpStatus"
import db from "@/db"
import { accountsTable } from "@/db/schema"
import { resetDb, seedManager } from "@/test/helpers/db"
import type { LoginInput, RegisterInput } from "@/validators/auth.validators"

const post = (path: string, body: unknown, token?: string) =>
  app.request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

const patch = (path: string, body: unknown, token: string) =>
  app.request(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

describe("register -> approve -> login (integration)", () => {
  beforeEach(resetDb)
  afterEach(resetDb)

  it("lets a registered user log in only after manager approves them", async () => {
    // 1. Register a new resident - should NOT be able to log in yet
    const residentBaseDetails = {
      email: "resident@example.com",
      password: "correct-horse-battery-staple",
    } satisfies LoginInput
    const registerRes = await post("/auth/register", {
      role: "resident",
      firstName: "New",
      lastName: "Resident",
      phone: "123456789",
      ...residentBaseDetails,
    } satisfies RegisterInput)
    expect(registerRes.status).toBe(HttpStatus.CREATED)

    const blockedLogin = await post("/auth/login", residentBaseDetails)
    expect(blockedLogin.status).toBe(HttpStatus.FORBIDDEN)

    // 2. Manager logs in
    const { manager, password } = await seedManager()
    const managerLogin = await post("/auth/login", {
      email: manager.email,
      password,
    } satisfies LoginInput)
    expect(managerLogin.status).toBe(HttpStatus.OK)

    const {
      data: { accessToken: managerToken },
    } = await managerLogin.json()

    // 3. Manager approves the resident
    const [resident] = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.email, residentBaseDetails.email))

    const approvedRes = await patch(
      `/accounts/${resident.id}/status`,
      { approvalStatus: "approved" },
      managerToken
    )
    expect(approvedRes.status).toBe(HttpStatus.OK)

    // 4. Resident can now log in
    const finalLogin = await post("/auth/login", residentBaseDetails)
    expect(finalLogin.status).toBe(HttpStatus.OK)

    const { data: loginData } = await finalLogin.json()
    expect(loginData.accessToken).toBeString()
  })
})
