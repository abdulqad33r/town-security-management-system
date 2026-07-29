import { pgEnum } from "drizzle-orm/pg-core"

export const accountRoleEnum = pgEnum("account_role", [
  "resident",
  "guard",
  "manager",
])
export type UserRole = (typeof accountRoleEnum.enumValues)[number]

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "declined",
  "suspended",
  "inactive",
])
export type ApprovalStatus = (typeof approvalStatusEnum.enumValues)[number]

export const genderEnum = pgEnum("gender", ["male", "female"])
export type Gender = (typeof genderEnum.enumValues)[number]

export const arrivalModeEnum = pgEnum("arrival_mode", [
  "foot",
  "vehicle",
  "ride_hailing",
  "taxi",
  "public_transport",
  "other",
])
export type ArrivalMode = (typeof arrivalModeEnum.enumValues)[number]

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "bike",
  "car",
  "scooter",
  "van",
  "truck",
  "other",
])
export type VehicleType = (typeof vehicleTypeEnum.enumValues)[number]

export const vehicleDocTypeEnum = pgEnum("vehicle_doc_type", [
  "registration_certificate",
  "insurance_slip",
  "maintenance_slip",
  "mot_slip",
  "road_tax_slip",
  "petrol_slip",
])
export type VehicleDocType = (typeof vehicleDocTypeEnum.enumValues)[number]

export const visitStatusEnum = pgEnum("visit_status", [
  "pending",
  "approved",
  "active",
  "completed",
  "cancelled",
  "rejected",
])
export type VisitStatus = (typeof visitStatusEnum.enumValues)[number]

export const approvalDecisionEnum = pgEnum("approval_decision", [
  "pending",
  "approved",
  "rejected",
])
export type ApprovalDecision = (typeof approvalDecisionEnum.enumValues)[number]

export const vehicleOwnerTypeEnum = pgEnum("vehicle_owner_type", [
  "resident",
  "company",
])
export type VehicleOwnerType = (typeof vehicleOwnerTypeEnum.enumValues)[number]

export const salaryRequestStatusEnum = pgEnum("salary_request_status", [
  "pending",
  "approved",
  "rejected",
])
export type SalaryRequestStatus =
  (typeof salaryRequestStatusEnum.enumValues)[number]

export const parcelStatusEnum = pgEnum("parcel_status", [
  "collected",
  "delivered",
  "returned",
])
export type ParcelStatus = (typeof parcelStatusEnum.enumValues)[number]

export const guardDocTypeEnum = pgEnum("guard_doc_type", [
  "cv",
  "proof_of_address",
  "ni",
  "dbs",
  "driving_license",
  "sia_badge",
])
export type GuardDocType = (typeof guardDocTypeEnum.enumValues)[number]

export const workStatusEnum = pgEnum("work_status", [
  "scheduled",
  "completed",
  "absent",
  "late",
  "cancelled",
])
export type WorkStatus = (typeof workStatusEnum.enumValues)[number]
