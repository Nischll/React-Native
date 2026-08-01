import { DAY_CODES, DayCode } from "@/src/types/checklist.types";

export function formatApiDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseApiDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDaysToDate(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ---- Week ending (Friday) helpers — used by daily & weekly checklists ----

export function getWeekEndingFriday(date: Date = new Date()): Date {
  const day = date.getDay(); // 0=Sun ... 5=Fri ... 6=Sat
  const diff = (5 - day + 7) % 7;
  return addDaysToDate(date, diff);
}

export function getPreviousWeekEnding(weekEnding: string): string {
  return formatApiDate(addDaysToDate(parseApiDate(weekEnding), -7));
}

export function getNextWeekEnding(weekEnding: string): string {
  return formatApiDate(addDaysToDate(parseApiDate(weekEnding), 7));
}

export function formatWeekEndingDisplay(weekEnding: string): string {
  return parseApiDate(weekEnding).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCompletedTime(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const DAY_OFFSET_FROM_FRIDAY: Record<DayCode, number> = {
  M: 4,
  T: 3,
  W: 2,
  Th: 1,
  F: 0,
};

export function getCompletedDateForDay(weekEnding: string, day: DayCode): string {
  const friday = parseApiDate(weekEnding);
  return formatApiDate(addDaysToDate(friday, -DAY_OFFSET_FROM_FRIDAY[day]));
}

export function getTodayApiDate(): string {
  return formatApiDate(new Date());
}

export function getTodayDayCodeForWeek(weekEnding: string): DayCode | null {
  const today = getTodayApiDate();
  for (const day of DAY_CODES) {
    if (getCompletedDateForDay(weekEnding, day) === today) return day;
  }
  return null;
}

// ---- Month ending helpers — used by monthly checklist ----

export function getMonthEnding(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getPreviousMonthEnding(monthEnding: string): string {
  const d = parseApiDate(monthEnding);
  return formatApiDate(getMonthEnding(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
}

export function getNextMonthEnding(monthEnding: string): string {
  const d = parseApiDate(monthEnding);
  return formatApiDate(getMonthEnding(new Date(d.getFullYear(), d.getMonth() + 1, 1)));
}

export function formatMonthEndingDisplay(monthEnding: string): string {
  return parseApiDate(monthEnding).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

// ---- Year ending helpers — used by annual checklist ----

export function getYearEnding(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 11, 31);
}

export function getPreviousYearEnding(yearEnding: string): string {
  const d = parseApiDate(yearEnding);
  return formatApiDate(getYearEnding(new Date(d.getFullYear() - 1, 0, 1)));
}

export function getNextYearEnding(yearEnding: string): string {
  const d = parseApiDate(yearEnding);
  return formatApiDate(getYearEnding(new Date(d.getFullYear() + 1, 0, 1)));
}

export function formatYearEndingDisplay(yearEnding: string): string {
  return String(parseApiDate(yearEnding).getFullYear());
}
