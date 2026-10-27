import { beforeEach, describe, expect, it, mock } from "bun:test"

import { HttpStatus } from "@/constants/httpStatus"
import { ZONES_NAME_LOWER_IDX } from "@/db/schema"

// ─────────────────────────────────────────────
// Mocks + factories
// ─────────────────────────────────────────────
const createZone = mock()

mock.module("@/repositories/locations.repository", () => ({
  createZone,
}))

const { addZone } = await import("./zones.service")

const makeInput = () => ({
  rate: 10,
  name: "Test Zone",
  postcode: "54000",
  wkt: "POLYGON((0 0, 0 1, 1 1, 0 0))",
  isActive: true,
})

// ─────────────────────────────────────────────
// addZone()
// ─────────────────────────────────────────────
describe("locations.service addZone()", () => {
  beforeEach(() => {
    createZone.mockReset()
  })

  it("creates a zone and returns the created zone", async () => {
    const input = makeInput()
    const createdZone = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    createZone.mockResolvedValue(createdZone)

    await expect(addZone(input)).resolves.toEqual(createdZone)

    expect(createZone).toHaveBeenCalledTimes(1)
    expect(createZone).toHaveBeenCalledWith(input)
  })

  it("throws a conflict error when the zone name already exists", async () => {
    createZone.mockRejectedValue({
      code: "23505",
      constraint: ZONES_NAME_LOWER_IDX,
    })

    await expect(addZone(makeInput())).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      message: "Zone already exists",
    })
  })

  it("rethrows a unique violation from a different constraint", async () => {
    const error = {
      code: "23505",
      constraint: "users_email_key",
    }

    createZone.mockRejectedValue(error)

    await expect(addZone(makeInput())).rejects.toBe(error)
  })

  it("rethrows unexpected errors unchanged", async () => {
    const error = new Error("Database connection failed")

    createZone.mockRejectedValue(error)

    await expect(addZone(makeInput())).rejects.toBe(error)
  })
})
