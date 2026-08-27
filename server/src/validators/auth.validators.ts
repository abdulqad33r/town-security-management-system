import z from "zod"

import { createAccountSchema } from "@/db/schema"

export const registerSchema = createAccountSchema
  .omit({ passwordHash: true })
  .extend({ password: z.string().min(8).max(72) })

export const loginSchema = z.object({
  email: registerSchema.shape.email,
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
