export const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** YYYY-MM-DD in the device local timezone (do not use toISOString for date-only). */
export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** API timestamp / ISO / yyyy-MM-dd → yyyy-MM-dd for DatePickerField. */
export function toDateInput(value?: string | null): string {
  if (value == null || String(value).trim() === "") return "";
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return formatDateOnly(d);
}

/**
 * Date picker value (yyyy-MM-dd) → ISO at local midnight, matching web
 * `dateInputToIsoOrNull` so Jackson can bind Timestamp fields.
 */
export function dateInputToIsoOrNull(
  raw: string | null | undefined,
): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  let s = String(raw).trim();
  if (s.length >= 10 && s[4] === "-" && s[7] === "-") {
    s = s.slice(0, 10);
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo, day, 0, 0, 0, 0);
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== y ||
    d.getMonth() !== mo ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d.toISOString();
}

export type DatePreset = "today" | "week" | "month";

/** Local calendar ranges for filter presets (This Month = 1st → last day of month). */
export function getDatePresetRange(
  type: DatePreset,
  now: Date = new Date(),
): { fromDate: string; toDate: string } {
  if (type === "today") {
    const value = formatDateOnly(now);
    return { fromDate: value, toDate: value };
  }

  if (type === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      fromDate: formatDateOnly(start),
      toDate: formatDateOnly(end),
    };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    fromDate: formatDateOnly(start),
    toDate: formatDateOnly(end),
  };
}
