import type { MiddlewareHandler } from "hono"

import { HttpStatus } from "@/constants/httpStatus"
import type { Permission } from "@/constants/permissions"
import { ROLE_PERMISSIONS } from "@/constants/permissions"
import { throwError } from "@/lib/errors/httpErrors"
import type { AppEnv } from "@/lib/types"

const requirePermission =
  (permission: Permission): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const role = c.get("role")
    const permissions = ROLE_PERMISSIONS[role]

    if (!permissions.includes(permission))
      throwError(HttpStatus.FORBIDDEN, "Insufficient permission")

    await next()
  }

export default requirePermission
