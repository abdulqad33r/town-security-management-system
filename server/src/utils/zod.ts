import z from "zod"

export const compact = <T extends z.ZodObject>(schema: T) =>
  z.object(schema.shape) as z.ZodObject<T["shape"]>
