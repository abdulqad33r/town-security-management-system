import { PERMISSIONS } from "@/constants/permissions"
import { requireAuth, requirePermission } from "@/middlewares"

export const readAccess = [
  requireAuth,
  requirePermission(PERMISSIONS.TOWN_VIEW),
]

export const writeAccess = [
  requireAuth,
  requirePermission(PERMISSIONS.LOCATION_MANAGE),
]
