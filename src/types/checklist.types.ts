export type ChecklistPeriod = "daily" | "weekly" | "monthly" | "annual";

export interface ChecklistPeriodConfig {
  period: ChecklistPeriod;
  /** API path prefix, e.g. "/daily-checklist" */
  basePath: string;
  title: string;
  templateTitle: string;
  /** "weekly-grid" periods (daily & weekly) show Sat–Fri toggle columns per row */
  gridType: "weekly-grid" | "period-cell";
}

export const CHECKLIST_CONFIGS: Record<ChecklistPeriod, ChecklistPeriodConfig> = {
  daily: {
    period: "daily",
    basePath: "/daily-checklist",
    title: "Daily Checklist",
    templateTitle: "Daily Checklist Template",
    gridType: "weekly-grid",
  },
  weekly: {
    period: "weekly",
    basePath: "/weekly-checklist",
    title: "Weekly Checklist",
    templateTitle: "Weekly Checklist Template",
    gridType: "weekly-grid",
  },
  monthly: {
    period: "monthly",
    basePath: "/monthly-checklist",
    title: "Monthly Checklist",
    templateTitle: "Monthly Checklist Template",
    gridType: "period-cell",
  },
  annual: {
    period: "annual",
    basePath: "/annual-checklist",
    title: "Annual Checklist",
    templateTitle: "Annual Checklist Template",
    gridType: "period-cell",
  },
};

// ---- Templates (shared shape across all 4 periods) ----

export interface ChecklistTemplateRequest {
  workTitle: string;
  buildingId: number;
  time: string;
  sortOrder: number;
}

export interface ChecklistTemplateResponse extends ChecklistTemplateRequest {
  id: number;
}

// ---- Weekly-grid records (daily & weekly periods): rows with Sat–Fri day cells ----

export type DayCode = "Sa" | "Su" | "M" | "T" | "W" | "Th" | "F";

export const DAY_CODES: DayCode[] = ["Sa", "Su", "M", "T", "W", "Th", "F"];

export const DAY_LABELS: Record<DayCode, string> = {
  Sa: "Sat",
  Su: "Sun",
  M: "Mon",
  T: "Tue",
  W: "Wed",
  Th: "Thu",
  F: "Fri",
};

/** Alternate API keys that map onto the 7-day week-ending-Friday codes. */
export const DAY_CODE_ALIASES: Record<DayCode, string[]> = {
  Sa: ["Sa", "SA", "SAT", "Sat", "Saturday"],
  Su: ["Su", "SU", "SUN", "Sun", "Sunday"],
  M: ["M", "MON", "Mon", "Monday"],
  T: ["T", "TUE", "Tue", "Tuesday"],
  W: ["W", "WED", "Wed", "Wednesday"],
  Th: ["Th", "TH", "THU", "Thu", "Thursday"],
  F: ["F", "FRI", "Fri", "Friday"],
};

export function pickDayCell<T>(
  days: Partial<Record<string, T>> | undefined,
  day: DayCode,
): T | undefined {
  if (!days) return undefined;
  for (const key of DAY_CODE_ALIASES[day]) {
    const cell = days[key];
    if (cell != null) return cell;
  }
  return undefined;
}

export interface WeeklyChecklistDayCell {
  detailId: number | null;
  isDone: boolean;
  completedDate: string;
  completedTime?: string | null;
}

export interface WeeklyChecklistRow {
  templateId: number;
  serialNumber?: number;
  sortOrder?: number;
  workTitle: string;
  time?: string;
  /** Present when API returns Sat–Fri cells (daily + updated weekly). */
  days?: Record<DayCode, WeeklyChecklistDayCell>;
  /** Legacy weekly: single cell for the template's scheduled weekday. */
  cell?: WeeklyChecklistDayCell;
  scheduledDay?: string;
  scheduledDate?: string;
  duration?: string;
}

export interface WeeklyChecklistResponse {
  masterId?: number | null;
  weekEnding: string;
  buildingId: number;
  buildingName?: string;
  employeeId: number;
  employeeName?: string;
  rows: WeeklyChecklistRow[];
}

export interface WeeklyCellUpdateRequest {
  buildingId: number;
  weekEnding: string;
  templateId: number;
  completedDate: string;
  isDone: boolean;
  completedTime?: string;
  employeeId?: number;
}

// ---- Period-cell records (monthly & annual periods): rows with a single cell ----

export interface PeriodChecklistCell {
  detailId?: number | null;
  isDone: boolean;
  completedDate: string;
  completedTime?: string | null;
}

export interface PeriodChecklistRow {
  templateId: number;
  serialNumber?: number;
  sortOrder?: number;
  workTitle: string;
  time?: string;
  cell: PeriodChecklistCell;
}

export interface PeriodChecklistResponse {
  masterId?: number | null;
  periodEnding: string;
  buildingId?: number;
  buildingName?: string;
  employeeId?: number;
  employeeName?: string;
  rows: PeriodChecklistRow[];
}

export interface PeriodCellUpdateRequest {
  buildingId: number;
  periodEnding: string;
  templateId: number;
  isDone: boolean;
  employeeId?: number;
}
