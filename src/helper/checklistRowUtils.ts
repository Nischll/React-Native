import {
  DAY_CODES,
  DayCode,
  WeeklyChecklistDayCell,
  WeeklyChecklistRow,
} from "@/src/types/checklist.types";
import { getCompletedDateForDay } from "./checklistDateUtils";

const SCHEDULED_DAY_TO_CODE: Record<string, DayCode> = {
  monday: "M",
  mon: "M",
  m: "M",
  tuesday: "T",
  tue: "T",
  tues: "T",
  t: "T",
  wednesday: "W",
  wed: "W",
  w: "W",
  thursday: "Th",
  thu: "Th",
  thurs: "Th",
  th: "Th",
  friday: "F",
  fri: "F",
  f: "F",
};

function emptyCell(completedDate: string): WeeklyChecklistDayCell {
  return {
    detailId: null,
    isDone: false,
    completedDate,
    completedTime: null,
  };
}

function resolveScheduledDayCode(
  row: WeeklyChecklistRow,
  weekEnding: string,
): DayCode {
  if (row.scheduledDate) {
    const date = String(row.scheduledDate).slice(0, 10);
    for (const day of DAY_CODES) {
      if (getCompletedDateForDay(weekEnding, day) === date) return day;
    }
  }
  if (row.scheduledDay) {
    const code = SCHEDULED_DAY_TO_CODE[row.scheduledDay.trim().toLowerCase()];
    if (code) return code;
  }
  if (row.time) {
    const dayPart = row.time.split(" - ")[0]?.trim().toLowerCase() ?? "";
    const code = SCHEDULED_DAY_TO_CODE[dayPart];
    if (code) return code;
  }
  return "F";
}

/**
 * Normalize weekly/daily checklist rows so the UI always has an M–F `days` map.
 * Weekly API historically returned only `cell` + `scheduledDay`; newer APIs return `days`.
 */
export function normalizeWeeklyChecklistRow(
  row: WeeklyChecklistRow,
  weekEnding: string,
): WeeklyChecklistRow {
  if (row.days && DAY_CODES.every((d) => row.days?.[d] != null)) {
    return row;
  }

  const days = {} as Record<DayCode, WeeklyChecklistDayCell>;
  for (const day of DAY_CODES) {
    days[day] = emptyCell(getCompletedDateForDay(weekEnding, day));
  }

  if (row.cell) {
    const scheduledDay = resolveScheduledDayCode(row, weekEnding);
    const completedDate =
      row.cell.completedDate ||
      row.scheduledDate ||
      getCompletedDateForDay(weekEnding, scheduledDay);
    days[scheduledDay] = {
      detailId: row.cell.detailId ?? null,
      isDone: !!row.cell.isDone,
      completedDate: String(completedDate).slice(0, 10),
      completedTime: row.cell.completedTime ?? null,
    };
  }

  return { ...row, days };
}

export function isRowDayDone(row: WeeklyChecklistRow, day: DayCode): boolean {
  return !!row.days?.[day]?.isDone;
}
