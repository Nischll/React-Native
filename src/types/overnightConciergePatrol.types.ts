import { DayCode } from "./checklist.types";

export const OCP_BASE_PATH = "/overnight-concierge-patrol";

export const OCP_TITLE_MAX = 200;
export const OCP_AREA_MAX = 500;
export const OCP_DESCRIPTION_MAX = 2000;

export type OcpPhotoStatus = "NORMAL" | "NOT_NORMAL";

export interface OcpAttachment {
  id: number;
  fileUrl?: string;
  originalFileName?: string;
  title?: string;
  area?: string;
  status?: OcpPhotoStatus | string;
  description?: string;
  active?: boolean;
}

export interface OcpDayCell {
  detailId: number | null;
  isDone: boolean;
  completedDate: string;
  completedTime?: string | null;
  attachments?: OcpAttachment[];
}

/** Photos shown on a completed cell. Unchecked days omit images even if files linger. */
export function ocpVisibleAttachments(
  cell?: OcpDayCell | null,
): OcpAttachment[] {
  if (!cell?.isDone) return [];
  return (cell.attachments ?? []).filter((a) => a.active !== false);
}

export interface OcpWeeklyRow {
  templateId: number;
  serialNumber?: number;
  sortOrder?: number;
  workTitle: string;
  time?: string;
  days?: Record<DayCode, OcpDayCell>;
}

export interface OcpWeeklyResponse {
  masterId?: number | null;
  weekEnding: string;
  buildingId: number;
  buildingName?: string;
  employeeId: number;
  employeeName?: string;
  requiresAttachmentsOnCheck?: boolean;
  rows: OcpWeeklyRow[];
}

export interface OcpSignatures {
  nightConcierge: string;
  operationsSupervisor: string;
  operationsManager: string;
  generalManager: string;
  director: string;
}

export const OCP_SIGNATURE_DEFAULTS: OcpSignatures = {
  nightConcierge: "",
  operationsSupervisor: "Bhuwan Budhathoki",
  operationsManager: "Nitin Prasad",
  generalManager: "Taurean Moses",
  director: "Nish Singh",
};

export interface OcpDraftPhoto {
  key: string;
  uri: string;
  name: string;
  mimeType: string;
  title: string;
  area: string;
  status: OcpPhotoStatus;
  description: string;
}

export function isOcpNotNormal(status?: string | null): boolean {
  return String(status ?? "").toUpperCase() === "NOT_NORMAL";
}

export function ocpCellHasNotNormal(cell?: OcpDayCell | null): boolean {
  return ocpVisibleAttachments(cell).some((a) => isOcpNotNormal(a.status));
}
