export type ChecklistPeriod = "daily" | "weekly" | "monthly" | "annual";

export interface ChecklistPeriodConfig {
  period: ChecklistPeriod;
  /** API path prefix, e.g. "/daily-checklist" */
  basePath: string;
  title: string;
  templateTitle: string;
  /** "weekly-grid" periods (daily & weekly) show M-F toggle columns per row */
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

// ---- Weekly-grid records (daily & weekly periods): rows with M-F day cells ----

export type DayCode = "M" | "T" | "W" | "Th" | "F";

export const DAY_CODES: DayCode[] = ["M", "T", "W", "Th", "F"];

export const DAY_LABELS: Record<DayCode, string> = {
  M: "Mon",
  T: "Tue",
  W: "Wed",
  Th: "Thu",
  F: "Fri",
};

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
  days: Record<DayCode, WeeklyChecklistDayCell>;
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
