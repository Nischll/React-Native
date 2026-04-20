
/** Matches backend TradeVisitEntryType */
export type TradeVisitEntryType = "BOOKED" | "WALK_IN";

/** Matches backend TradeWorkType */
export type TradeWorkType =
  | "EMERGENCY"
  | "PREVENTIVE_MAINTENANCE"
  | "INSUITE"
  | "GENERAL_MAINTENANCE";

export type TradeKeyFobStatus = "RETURNED" | "ON_HOLD";

/** Matches backend TradeVisitLifecycleStatus */
export type TradeVisitLifecycleStatus = "REGISTERED" | "ON_SITE" | "COMPLETED";

export const LIFECYCLE_STATUS_OPTIONS: {
  value: TradeVisitLifecycleStatus;
  label: string;
  hint: string;
}[] = [
  {
    value: "REGISTERED",
    label: "Registered",
    hint: "Created / scheduled or walk-in",
  },
  { value: "ON_SITE", label: "On site", hint: "Key/fob assigned, on site" },
  {
    value: "COMPLETED",
    label: "Completed",
    hint: "Work finished, key returned or on hold",
  },
];

export const ENTRY_TYPE_OPTIONS: {
  value: TradeVisitEntryType;
  label: string;
}[] = [
  { value: "BOOKED", label: "Booked" },
  { value: "WALK_IN", label: "Walk-in" },
];

export const WORK_TYPE_OPTIONS: { value: TradeWorkType; label: string }[] = [
  { value: "EMERGENCY", label: "Emergency" },
  { value: "PREVENTIVE_MAINTENANCE", label: "Preventive maintenance" },
  { value: "INSUITE", label: "In-suite" },
  { value: "GENERAL_MAINTENANCE", label: "General maintenance" },
];

export const KEY_FOB_STATUS_OPTIONS: {
  value: TradeKeyFobStatus;
  label: string;
}[] = [
  { value: "RETURNED", label: "Returned" },
  { value: "ON_HOLD", label: "On hold" },
];

export interface TradeVisitCreatePojo {
  entryType: TradeVisitEntryType;
  workType: TradeWorkType;
  tradeName: string;
  company?: string;
  workOrderNumber?: string;
  phoneNumber?: string;
  reasonForVisit?: string;
  location?: string;
  buildingId: number;
  residentId?: number | null;
  /** ISO 8601 or backend Timestamp serialization */
  scheduledAppointmentAt?: string | null;
}

export interface TradeVisitUpdatePojo {
  workType?: TradeWorkType;
  tradeName?: string;
  company?: string;
  workOrderNumber?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  reasonForVisit?: string;
  location?: string;
  residentId?: number | null;
  scheduledAppointmentAt?: string | null;
}

export interface TradeVisitCheckInPojo {
  fobOrKeyAssigned: string;
  timeIn?: string | null;
}

export interface TradeVisitCheckoutPojo {
  keyFobStatus: TradeKeyFobStatus;
  timeOut?: string | null;
  signatureData?: string | null;
}

export interface TradeVisitResponse {
  id: number;
  entryType: TradeVisitEntryType;
  workType: TradeWorkType;
  lifecycleStatus: TradeVisitLifecycleStatus | string;
  tradeName: string;
  company?: string;
  workOrderNumber?: string;
  phoneNumber?: string;
  bookingSmsSent?: boolean;
  phoneVerified?: boolean;
  reasonForVisit?: string;
  location?: string;
  buildingId: number;
  buildingName?: string;
  residentId?: number | null;
  residentUnit?: string;
  scheduledAppointmentAt?: string | null;
  fobOrKeyAssigned?: string;
  timeIn?: string | null;
  timeOut?: string | null;
  totalMinutesSpent?: number | null;
  /** PM has approved (with file). false = not approved or revoked. */
  pmApproved?: boolean;
  /** Present only when pmApproved is true */
  pmApprovalAttachment?: {
    originalFileName?: string;
    /** e.g. /api/trade-visit/{id}/pm-approval-attachment */
    downloadUrl?: string;
  } | null;
  /**
   * When true (strata), check-in requires pmApproved plus pmApprovalAttachment on file.
   * Backend should set this for STRATA_MANAGEMENT buildings. If omitted, client only gates on pmApproved.
   */
  pmApprovalDocumentRequiredForCheckIn?: boolean;
  keyFobStatus?: TradeKeyFobStatus | null;
  signatureData?: string | null;
  workCompleted?: boolean;
}

/** Absolute URL for opening/downloading PM approval file (uses VITE_BASE_URL). */
// export function tradeVisitPmAttachmentAbsoluteUrl(
//   visitId: number,
//   downloadUrl?: string | null,
// ): string {
//   const raw =
//     (downloadUrl && downloadUrl.trim()) ||
//     `api/trade-visit/${visitId}/pm-approval-attachment`;
//   const path = raw.startsWith("/") ? raw.slice(1) : raw;
//   const base = (
//     typeof import.meta !== "undefined" && BASE_URL ? String(BASE_URL) : ""
//   ).replace(/\/$/, "");
//   return `${base}/${path}`;
// }
