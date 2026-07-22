import type { ZodError } from "zod"

import { ERROR_TYPES } from "../../utils/constants"

const formatZodError = (error: ZodError) => ({
  type: ERROR_TYPES.VALIDATION_ERROR,
  message: "Validation Failed" as const,
  errors: error.issues.map(issue => ({
    message: issue.message,
    path: issue.path.join("."),
  })),
})

export default formatZodError
