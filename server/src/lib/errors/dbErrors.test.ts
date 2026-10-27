import { describe, expect, it } from "bun:test"

import { isUniqueViolation } from "./dbErrors"

describe("isUniqueViolation()", () => {
  it("returns true when code is 23505", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true)
  })

  it("returns true when errno is 23505", () => {
    expect(isUniqueViolation({ errno: "23505" })).toBe(true)
  })

  it("returns true when code is 23505 inside cause", () => {
    expect(
      isUniqueViolation({
        cause: { code: "23505" },
      })
    ).toBe(true)
  })

  it("returns true when errno is 23505 inside cause", () => {
    expect(
      isUniqueViolation({
        cause: { errno: "23505" },
      })
    ).toBe(true)
  })

  it("returns true when the constraint matches", () => {
    expect(
      isUniqueViolation(
        {
          code: "23505",
          constraint: "zones_name_lower_idx",
        },
        "zones_name_lower_idx"
      )
    ).toBe(true)
  })

  it("returns false when the constraint does not match", () => {
    expect(
      isUniqueViolation(
        {
          code: "23505",
          constraint: "users_email_key",
        },
        "zones_name_lower_idx"
      )
    ).toBe(false)
  })

  it("returns true for any unique violation when no constraint is provided", () => {
    expect(
      isUniqueViolation({
        code: "23505",
        constraint: "users_email_key",
      })
    ).toBe(true)
  })

  it("returns false when the PostgreSQL error code is different", () => {
    expect(
      isUniqueViolation({
        code: "23503",
        constraint: "zones_name_lower_idx",
      })
    ).toBe(false)
  })

  it("returns false for invalid or unrelated errors", () => {
    expect(isUniqueViolation(null)).toBe(false)
    expect(isUniqueViolation(undefined)).toBe(false)
    expect(isUniqueViolation({})).toBe(false)
    expect(isUniqueViolation(new Error("Database connection failed"))).toBe(
      false
    )
  })
})
