import type { ZodError } from "zod"

import { HttpErrorStatusLabels } from "@/constants/errorTypes"

const formatZodError = (error: ZodError) => ({
  type: HttpErrorStatusLabels.VALIDATION_ERROR,
  message: "Validation Failed" as const,
  errors: error.issues.map(issue => ({
    message: issue.message,
    path: issue.path.join("."),
  })),
})

export default formatZodError
