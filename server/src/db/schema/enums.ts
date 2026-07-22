import { pgEnum } from "drizzle-orm/pg-core"

export const accountRoleEnum = pgEnum("account_role", [
  "resident",
  "guard",
  "manager",
])

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "declined",
  "suspended",
  "inactive",
])

export const genderEnum = pgEnum("gender", ["male", "female"])

export const arrivalModeEnum = pgEnum("arrival_mode", [
  "foot",
  "vehicle",
  "ride_hailing",
  "taxi",
  "public_transport",
  "other",
])

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "bike",
  "car",
  "scooter",
  "van",
  "truck",
  "other",
])

export const vehicleDocTypeEnum = pgEnum("vehicle_doc_type", [
  "registration_certificate",
  "insurance_slip",
  "maintenance_slip",
  "mot_slip",
  "road_tax_slip",
  "petrol_slip",
])

export const visitStatusEnum = pgEnum("visit_status", [
  "pending",
  "approved",
  "active",
  "completed",
  "cancelled",
  "rejected",
])

export const approvalDecisionEnum = pgEnum("approval_decision", [
  "pending",
  "approved",
  "rejected",
])

export const vehicleOwnerTypeEnum = pgEnum("vehicle_owner_type", [
  "resident",
  "company",
])

export const salaryRequestStatusEnum = pgEnum(
  "salary_request_status",
  ["pending", "approved", "rejected"]
)

export const parcelStatusEnum = pgEnum("parcel_status", [
  "collected",
  "delivered",
  "returned",
])

export const guardDocTypeEnum = pgEnum("guard_doc_type", [
  "cv",
  "proof_of_address",
  "ni",
  "dbs",
  "driving_license",
  "sia_badge",
])

export const workStatusEnum = pgEnum("work_status", [
  "scheduled",
  "completed",
  "absent",
  "late",
  "cancelled",
])
