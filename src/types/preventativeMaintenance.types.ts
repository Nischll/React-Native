export type PreventiveMaintenanceStatus =
  | "SCHEDULED"
  | "REQUESTED"
  | "COMPLETED"
  | "CANCELLED";

export type StatusPerMonth = Record<string, PreventiveMaintenanceStatus>;
export type NotesPerMonth = Record<string, string>;

export interface PreventiveMaintenanceRequestPojo {
  id?: number;
  buildingId?: number;
  year?: number;
  maintenanceItem: string;
  frequency?: string;
  timeOfCompletion?: string;
  status?: PreventiveMaintenanceStatus;
  statusPerMonth?: StatusPerMonth;
  notesPerMonth?: NotesPerMonth;
  notes?: string;
  tradeInvolved?: string;
  estCost?: string;
  trade?: string;
  /** comma-separated month codes, e.g. "JAN,MAR,JUN,SEP" */
  scheduledMonths?: string;
}

export interface PreventiveMaintenanceResponse
  extends PreventiveMaintenanceRequestPojo {
  id: number;
  buildingId?: number;
  buildingName?: string;
}

export const PREVENTIVE_MAINTENANCE_STATUS_OPTIONS: {
  value: PreventiveMaintenanceStatus;
  label: string;
}[] = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "REQUESTED", label: "Requested" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const MONTH_CODES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export const STATUS_COLORS: Record<
  PreventiveMaintenanceStatus,
  { bg: string; label: string; letter: string }
> = {
  SCHEDULED: { bg: "bg-emerald-600", label: "Scheduled", letter: "S" },
  REQUESTED: { bg: "bg-amber-500", label: "Requested", letter: "R" },
  COMPLETED: { bg: "bg-blue-600", label: "Completed", letter: "C" },
  CANCELLED: { bg: "bg-slate-500", label: "Cancelled", letter: "X" },
};

export function parseScheduledMonths(s?: string): Set<string> {
  if (!s || typeof s !== "string") return new Set();
  const parts = s.split(",").map((m) => m.trim().toUpperCase());
  const codes = new Set<string>();
  const monthCodeSet = new Set(MONTH_CODES);
  for (const p of parts) {
    if (monthCodeSet.has(p)) codes.add(p);
    else {
      const n = parseInt(p, 10);
      if (n >= 1 && n <= 12) codes.add(MONTH_CODES[n - 1]);
    }
  }
  return codes;
}

export function serializeScheduledMonths(months: Set<string>): string {
  return Array.from(months)
    .sort((a, b) => MONTH_CODES.indexOf(a) - MONTH_CODES.indexOf(b))
    .join(",");
}

export function getMonthStatus(
  item: PreventiveMaintenanceResponse,
  monthCode: string,
): PreventiveMaintenanceStatus {
  const spm = item.statusPerMonth;
  if (spm && spm[monthCode])
    return spm[monthCode] as PreventiveMaintenanceStatus;
  return (item.status ?? "SCHEDULED") as PreventiveMaintenanceStatus;
}
