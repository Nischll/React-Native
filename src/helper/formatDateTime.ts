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
