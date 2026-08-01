export const PERMISSIONS = {
  ACCOUNT_MANAGE_OWN: "account:manage:own",
  ACCOUNT_MANAGE_ANY: "account:manage:any",
  ACCOUNT_APPROVE: "account:approve",

  TOWN_VIEW: "town:view",

  GUEST_APPROVE: "guest:approve",

  PARCEL_COLLECT: "parcel:collect",

  GUARD_MANAGE: "guard:manage",
  RESIDENT_MANAGE: "resident:manage",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ROLE_PERMISSIONS: Record<
  "resident" | "guard" | "manager",
  Permission[]
> = {
  resident: [
    PERMISSIONS.ACCOUNT_MANAGE_OWN,
    PERMISSIONS.TOWN_VIEW,
    PERMISSIONS.GUEST_APPROVE,
    PERMISSIONS.PARCEL_COLLECT,
  ],
  guard: [
    PERMISSIONS.ACCOUNT_MANAGE_OWN,
    PERMISSIONS.TOWN_VIEW,
    PERMISSIONS.GUEST_APPROVE,
    PERMISSIONS.PARCEL_COLLECT,
  ],
  manager: [
    PERMISSIONS.ACCOUNT_MANAGE_OWN,
    PERMISSIONS.ACCOUNT_MANAGE_ANY,
    PERMISSIONS.ACCOUNT_APPROVE,
    PERMISSIONS.TOWN_VIEW,
    PERMISSIONS.GUEST_APPROVE,
    PERMISSIONS.PARCEL_COLLECT,
    PERMISSIONS.GUARD_MANAGE,
    PERMISSIONS.RESIDENT_MANAGE,
  ],
}
