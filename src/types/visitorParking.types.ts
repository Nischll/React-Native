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
  residentId?: number | null;
  residentUnit?: string | null;
  residentName?: string | null;
}

export interface VisitorParkingInspectionResponse
  extends VisitorParkingInspectionCreatePojo {
  id: number;
  calendarMonthKey?: string;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
  residentVehicle?: boolean | null;
  registeredVehicleResidentId?: number | null;
  registeredVehicleResidentUnit?: string | null;
  registeredVehicleResidentName?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  matchedVisitorPassId?: number | null;
  matchedVisitorPassNumber?: string | null;
  rollupPolicyViolation?: boolean | null;
  residentMatchPolicyBreach?: boolean | null;
  policy?: BuildingVisitorParkingPolicyResponse | null;
}
