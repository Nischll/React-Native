export type PeriodOfDay = "DAY" | "NIGHT";

export type TowWorkflowStatus =
  | "NOT_APPLICABLE"
  | "ORDERED"
  | "COMPLETED"
  | "CANCELLED";

export const PERIOD_OF_DAY_OPTIONS: { label: string; value: PeriodOfDay }[] = [
  { label: "Day", value: "DAY" },
  { label: "Night", value: "NIGHT" },
];

export const TOW_WORKFLOW_STATUS_OPTIONS: {
  label: string;
  value: TowWorkflowStatus;
}[] = [
  { label: "Not Applicable", value: "NOT_APPLICABLE" },
  { label: "Ordered", value: "ORDERED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export interface BuildingVisitorParkingPolicyRequestPojo {
  visitorStallCount?: number;
  maxSessionsPerCalendarMonth?: number;
  maxConsecutiveOvernightNightsPerMonth?: number;
  maxContinuousParkingHours?: number;
  overnightParkingAllowed?: boolean;
  policyNotes?: string;
}

export interface BuildingVisitorParkingPolicyResponse
  extends BuildingVisitorParkingPolicyRequestPojo {
  id?: number | null;
  buildingId?: number | null;
  isActive?: boolean | null;
  createdDate?: string;
  updatedDate?: string;
}

export interface VisitorParkingRollupResponsePojo {
  buildingId?: number;
  buildingName?: string;
  licensePlate?: string;
  calendarMonthKey?: string;
  buildingTimeZoneEffective?: string;
  year?: number;
  month?: number;
  totalInspections?: number;
  distinctObservationDays?: number;
  maxContinuousSpanHoursInSession?: number;
  maxConsecutiveOvernightNights?: number;
  hoursFromFirstToLastObservation?: number;
  policyVisitorStallCount?: number | null;
  policyMaxSessionsPerCalendarMonth?: number | null;
  policyMaxConsecutiveOvernightNightsPerMonth?: number | null;
  policyMaxContinuousParkingHours?: number | null;
  policyOvernightParkingAllowed?: boolean | null;
  monthlyDistinctDayLimitExceeded?: boolean;
  consecutiveNightLimitExceeded?: boolean;
  continuousHoursLimitExceeded?: boolean;
  overnightRuleViolated?: boolean;
  linkedVisitorPassId?: number | null;
  linkedVisitorPassNumber?: string | null;
  passLinkAmbiguous?: boolean | null;
}

export interface VisitorParkingPlateVehicleDetailsPojo {
  buildingId?: number;
  licensePlate?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  residentVehicle?: boolean | null;
  registeredVehicleMatchAmbiguous?: boolean | null;
  fromPriorInspection?: boolean;
}

export interface VisitorParkingInspectionUpdatePojo {
  stallIdentifier: string;
  licensePlate: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  passNumberDisplay?: string;
  towWorkflowStatus?: TowWorkflowStatus;
  bylawNoticeIssued?: boolean;
  violationSlipIssued?: boolean;
  periodOfDay?: PeriodOfDay;
  visitDayCountInMonth?: number;
  violationNotes?: string;
}

export interface VisitorParkingInspectionCreatePojo {
  buildingId: number;
  stallIdentifier: string;
  licensePlate: string;
  observedAt?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  passNumberDisplay?: string;
  towWorkflowStatus?: TowWorkflowStatus;
  bylawNoticeIssued?: boolean;
  violationSlipIssued?: boolean;
  periodOfDay?: PeriodOfDay;
  visitDayCountInMonth?: number;
  reportingCalendarYear?: number;
  reportingCalendarMonth?: number;
  violationNotes?: string;
}

export interface VisitorParkingInspectionResponse
  extends VisitorParkingInspectionCreatePojo {
  id: number;
  calendarMonthKey?: string;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
  /** From matched visitor pass (server-set; not writable on PUT). */
  residentId?: number | null;
  residentUnit?: string | null;
  residentName?: string | null;
  noPassViolation?: boolean | null;
  noPassBreach?: boolean | null;
  residentVehicle?: boolean | null;
  registeredVehicleResidentId?: number | null;
  registeredVehicleResidentUnit?: string | null;
  registeredVehicleResidentName?: string | null;
  registeredVehicleMatchAmbiguous?: boolean | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  matchedVisitorPassId?: number | null;
  matchedVisitorPassNumber?: string | null;
  passMatchAmbiguous?: boolean | null;
  rollup?: VisitorParkingRollupResponsePojo | null;
  rollupPolicyViolation?: boolean | null;
  residentMatchPolicyBreach?: boolean | null;
  policy?: BuildingVisitorParkingPolicyResponse | null;
}

export function policyBreachDetailItems(
  inspection: VisitorParkingInspectionResponse,
): string[] {
  const items: string[] = [];
  if (inspection.noPassViolation || inspection.noPassBreach) {
    items.push("No visitor pass (no-pass violation)");
  }
  const rollup = inspection.rollup;
  if (rollup) {
    if (rollup.monthlyDistinctDayLimitExceeded) {
      items.push("Monthly distinct day limit exceeded");
    }
    if (rollup.consecutiveNightLimitExceeded) {
      items.push("Consecutive overnight night limit exceeded");
    }
    if (rollup.continuousHoursLimitExceeded) {
      items.push("Continuous hours (within session) limit exceeded");
    }
    if (rollup.overnightRuleViolated) {
      items.push("Overnight rule violated (NIGHT period)");
    }
  }
  if (inspection.residentMatchPolicyBreach) {
    items.push("Resident vehicle registry match (visitor parking policy)");
  }
  return items;
}
