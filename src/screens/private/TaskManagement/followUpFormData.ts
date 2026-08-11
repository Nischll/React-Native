import type {
  FollowUpRequestRow,
  FollowUpResponse,
} from "@/src/types/task-management.types";

/**
 * Appends follow-up rows as indexed FormData keys for Spring @ModelAttribute binding.
 * Always call on task create/update so the backend can sync the list:
 * - rows with id → update
 * - rows without id → create
 * - existing DB rows missing from the list → soft-deleted
 * Empty array appends no indices (clears all follow-ups on sync).
 */
export function appendFollowUpsToFormData(
  fd: FormData,
  followUps: FollowUpRequestRow[] | undefined,
): void {
  const rows = followUps ?? [];
  rows.forEach((row, i) => {
    if (row.id != null) {
      fd.append(`followUpRequestPojoList[${i}].id`, String(row.id));
    }
    fd.append(
      `followUpRequestPojoList[${i}].followUpDate`,
      toFollowUpDateInput(row.followUpDate),
    );
    fd.append(
      `followUpRequestPojoList[${i}].description`,
      row.description ?? "",
    );
    fd.append(
      `followUpRequestPojoList[${i}].followUpMethod`,
      row.followUpMethod,
    );
    fd.append(`followUpRequestPojoList[${i}].trade`, row.trade ?? "");
  });
}

/** Normalize backend timestamp / ISO date to yyyy-MM-dd for the date picker / API. */
export function toFollowUpDateInput(value: string | null | undefined): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function mapFollowUpsFromResponse(
  list: FollowUpResponse[] | null | undefined,
): FollowUpRequestRow[] {
  return (list ?? []).map((fu) => ({
    id: fu.id,
    followUpDate: toFollowUpDateInput(fu.followUpDate),
    description: fu.description ?? "",
    followUpMethod: fu.followUpMethod,
    trade: fu.trade ?? "",
  }));
}

export function emptyFollowUpRow(): FollowUpRequestRow {
  return {
    followUpDate: "",
    description: "",
    followUpMethod: "",
    trade: "",
  };
}

function isBlankFollowUpRow(row: FollowUpRequestRow): boolean {
  return (
    !row.followUpDate?.trim() &&
    !row.description?.trim() &&
    !row.followUpMethod &&
    !row.trade?.trim() &&
    row.id == null
  );
}

/**
 * Drops blank draft rows, then validates remaining rows have date + method.
 * Returns ready-to-submit rows or an error message.
 */
export function prepareFollowUpsForSubmit(
  followUps: FollowUpRequestRow[] | undefined,
): { rows: FollowUpRequestRow[]; error?: string } {
  const rows = (followUps ?? []).filter((row) => !isBlankFollowUpRow(row));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const date = toFollowUpDateInput(row.followUpDate);
    if (!date) {
      return {
        rows: [],
        error: `Follow-up ${i + 1}: date is required`,
      };
    }
    if (!row.followUpMethod) {
      return {
        rows: [],
        error: `Follow-up ${i + 1}: method is required`,
      };
    }
    rows[i] = { ...row, followUpDate: date };
  }

  return { rows };
}
