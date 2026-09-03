import { parseExpiry } from "./parseExpiry"
import { describe, expect, it } from "bun:test"

describe("parseExpiry", () => {
  it("parses seconds", () => {
    expect(parseExpiry("30s")).toBe(30)
  })

  it("parses minutes", () => {
    expect(parseExpiry("15m")).toBe(15 * 60)
  })

  it("parses hours", () => {
    expect(parseExpiry("2h")).toBe(2 * 60 * 60)
  })

  it("parses days", () => {
    expect(parseExpiry("7d")).toBe(7 * 24 * 60 * 60)
  })

  it("throws an invalid format", () => {
    expect(() => parseExpiry("banana")).toThrow()
    expect(() => parseExpiry("15")).toThrow() // missing unit
    expect(() => parseExpiry("15x")).toThrow() // unknown unit
  })
})
