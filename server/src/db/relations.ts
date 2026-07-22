import { defineRelations } from "drizzle-orm"

import * as schema from "./schema"

export const relations = defineRelations(schema, r => ({
  // ? ───────────────── Accounts ─────────────────
  accountsTable: {
    managerProfile: r.one.managerProfilesTable(),
    guardProfile: r.one.guardProfilesTable(),
    houseMember: r.one.houseMembersTable(),
    vehicles: r.many.vehiclesTable(),
  },

  // ? ───────────────── Manager Profiles ─────────────────
  managerProfilesTable: {
    account: r.one.accountsTable({
      from: r.managerProfilesTable.accountId,
      to: r.accountsTable.id,
    }),
    assignedSchedules: r.many.guardSchedulesTable(),
    generatedSlips: r.many.guardSalarySlipsTable(),
  },

  // ? ───────────────── Guard Profiles ─────────────────
  guardProfilesTable: {
    account: r.one.accountsTable({
      from: r.guardProfilesTable.accountId,
      to: r.accountsTable.id,
    }),
    documents: r.many.guardDocumentsTable(),
    schedules: r.many.guardSchedulesTable(),
    salaryRequests: r.many.guardSalaryRequestsTable(),
    salarySlips: r.many.guardSalarySlipsTable(),
    parcels: r.many.parcelCollectionsTable(),
    guestVisits: r.many.guestVisitsTable(),
  },

  // ? ───────────────── Guard Documents ─────────────────
  guardDocumentsTable: {
    guard: r.one.guardProfilesTable({
      from: r.guardDocumentsTable.guardId,
      to: r.guardProfilesTable.accountId,
    }),
  },

  // ? ───────────────── Zones ─────────────────
  zonesTable: {
    streets: r.many.streetsTable(),
    houses: r.many.housesTable(),
    schedules: r.many.guardSchedulesTable(),
    guestVisits: r.many.guestVisitsTable(),
  },

  // ? ───────────────── Streets ─────────────────
  streetsTable: {
    zone: r.one.zonesTable({
      from: r.streetsTable.zoneId,
      to: r.zonesTable.id,
    }),
    houses: r.many.housesTable(),
    guestVisits: r.many.guestVisitsTable(),
  },

  // ? ───────────────── Houses ─────────────────
  housesTable: {
    zone: r.one.zonesTable({
      from: r.housesTable.zoneId,
      to: r.zonesTable.id,
    }),
    street: r.one.streetsTable({
      from: r.housesTable.streetId,
      to: r.streetsTable.id,
    }),
    members: r.many.houseMembersTable(),
    vehicles: r.many.vehiclesTable(),
    parcels: r.many.parcelCollectionsTable(),
    guestVisits: r.many.guestVisitsTable(),
  },

  // ? ───────────────── House Members ─────────────────
  houseMembersTable: {
    account: r.one.accountsTable({
      from: r.houseMembersTable.accountId,
      to: r.accountsTable.id,
    }),
    house: r.one.housesTable({
      from: r.houseMembersTable.houseId,
      to: r.housesTable.id,
    }),
    receivedParcels: r.many.parcelCollectionsTable(),
    hostedVisits: r.many.guestVisitsTable(),
  },

  // ? ───────────────── Vehicles ─────────────────
  vehiclesTable: {
    owner: r.one.accountsTable({
      from: r.vehiclesTable.ownerId,
      to: r.accountsTable.id,
    }),
    house: r.one.housesTable({
      from: r.vehiclesTable.houseId,
      to: r.housesTable.id,
      optional: true,
    }),
    documents: r.many.vehicleDocumentsTable(),
  },

  // ? ───────────────── Vehicle Documents ─────────────────
  vehicleDocumentsTable: {
    vehicle: r.one.vehiclesTable({
      from: r.vehicleDocumentsTable.vehicleId,
      to: r.vehiclesTable.id,
    }),
  },

  // ? ───────────────── Shifts ─────────────────
  shiftsTable: {
    schedules: r.many.guardSchedulesTable(),
  },

  // ? ───────────────── Guard Schedules ─────────────────
  guardSchedulesTable: {
    guard: r.one.guardProfilesTable({
      from: r.guardSchedulesTable.guardId,
      to: r.guardProfilesTable.accountId,
    }),
    shift: r.one.shiftsTable({
      from: r.guardSchedulesTable.shiftId,
      to: r.shiftsTable.id,
    }),
    zone: r.one.zonesTable({
      from: r.guardSchedulesTable.zoneId,
      to: r.zonesTable.id,
    }),
    assignedBy: r.one.managerProfilesTable({
      from: r.guardSchedulesTable.assignedById,
      to: r.managerProfilesTable.accountId,
    }),
    attendances: r.one.guardAttendancesTable(),
    salarySlipItems: r.many.guardSalarySlipItemsTable(),
  },

  // ? ───────────────── Guard Attendances ─────────────────
  guardAttendancesTable: {
    schedule: r.one.guardSchedulesTable({
      from: r.guardAttendancesTable.guardScheduleId,
      to: r.guardSchedulesTable.id,
    }),
  },

  // ? ───────────────── Salary Requests ─────────────────
  guardSalaryRequestsTable: {
    guard: r.one.guardProfilesTable({
      from: r.guardSalaryRequestsTable.guardId,
      to: r.guardProfilesTable.accountId,
    }),
    approvedBy: r.one.managerProfilesTable({
      from: r.guardSalaryRequestsTable.approvedByManagerId,
      to: r.managerProfilesTable.accountId,
    }),
    slip: r.one.guardSalarySlipsTable(),
  },

  // ? ───────────────── Salary Slips ─────────────────
  guardSalarySlipsTable: {
    guard: r.one.guardProfilesTable({
      from: r.guardSalarySlipsTable.guardId,
      to: r.guardProfilesTable.accountId,
    }),
    generatedBy: r.one.managerProfilesTable({
      from: r.guardSalarySlipsTable.generatedByManagerId,
      to: r.managerProfilesTable.accountId,
    }),
    salaryRequest: r.one.guardSalaryRequestsTable({
      from: r.guardSalarySlipsTable.salaryRequestId,
      to: r.guardSalaryRequestsTable.id,
      optional: true,
    }),
    items: r.many.guardSalarySlipItemsTable(),
  },

  // ? ───────────────── Salary Slip Items ─────────────────
  guardSalarySlipItemsTable: {
    slip: r.one.guardSalarySlipsTable({
      from: r.guardSalarySlipItemsTable.salarySlipId,
      to: r.guardSalarySlipsTable.id,
    }),
    schedule: r.one.guardSchedulesTable({
      from: r.guardSalarySlipItemsTable.guardScheduleId,
      to: r.guardSchedulesTable.id,
    }),
  },

  // ? ───────────────── Guest Visits ─────────────────
  guestVisitsTable: {
    recordedByGuard: r.one.guardProfilesTable({
      from: r.guestVisitsTable.recordedByGuardAccountId,
      to: r.guardProfilesTable.accountId,
    }),
    hostHouse: r.one.housesTable({
      from: r.guestVisitsTable.hostHouseId,
      to: r.housesTable.id,
    }),
    hostMember: r.one.houseMembersTable({
      from: r.guestVisitsTable.hostMemberId,
      to: r.houseMembersTable.accountId,
    }),
    zone: r.one.zonesTable({
      from: r.guestVisitsTable.zoneId,
      to: r.zonesTable.id,
    }),
    street: r.one.streetsTable({
      from: r.guestVisitsTable.streetId,
      to: r.streetsTable.id,
    }),
    approval: r.one.guestVisitApprovalsTable(),
  },

  // ? ───────────────── Guest Visit Approvals ─────────────────
  guestVisitApprovalsTable: {
    visit: r.one.guestVisitsTable({
      from: r.guestVisitApprovalsTable.guestVisitId,
      to: r.guestVisitsTable.id,
    }),
    decidedBy: r.one.accountsTable({
      from: r.guestVisitApprovalsTable.decidedByAccountId,
      to: r.accountsTable.id,
      optional: true,
    }),
  },

  // ? ───────────────── Parcel Collections ─────────────────────────────────
  parcelCollectionsTable: {
    collectedBy: r.one.guardProfilesTable({
      from: r.parcelCollectionsTable.collectedByGuardId,
      to: r.guardProfilesTable.accountId,
    }),
    house: r.one.housesTable({
      from: r.parcelCollectionsTable.houseId,
      to: r.housesTable.id,
    }),
    receivedFor: r.one.houseMembersTable({
      from: r.parcelCollectionsTable.receivedForMemberId,
      to: r.houseMembersTable.accountId,
    }),
  },
}))
