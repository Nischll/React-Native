import {
  DatePreset,
  getDatePresetRange,
} from "@/src/helper/formatDateTime";
import { useCallback, useMemo, useState } from "react";

export type DateRangePreset = DatePreset | "custom";

export function useDateRangeFilter(
  initial: DateRangePreset = "month",
) {
  const initialRange =
    initial === "custom"
      ? getDatePresetRange("month")
      : getDatePresetRange(initial);

  const [dateType, setDateType] = useState<DateRangePreset>(
    initial === "custom" ? "month" : initial,
  );
  const [fromDate, setFromDate] = useState<string>(initialRange.fromDate);
  const [toDate, setToDate] = useState<string>(initialRange.toDate);

  const applyPreset = useCallback((type: DateRangePreset) => {
    if (type !== "custom") {
      const range = getDatePresetRange(type);
      setFromDate(range.fromDate);
      setToDate(range.toDate);
    }
    setDateType(type);
  }, []);

  const setCustomFrom = useCallback((value?: string) => {
    const next = value?.split("T")[0];
    if (!next) return;
    setFromDate(next);
    setDateType("custom");
  }, []);

  const setCustomTo = useCallback((value?: string) => {
    const next = value?.split("T")[0];
    if (!next) return;
    setToDate(next);
    setDateType("custom");
  }, []);

  const rangeLabel = useMemo(() => {
    if (!fromDate || !toDate) return "";
    if (fromDate === toDate) return fromDate;
    return `${fromDate} → ${toDate}`;
  }, [fromDate, toDate]);

  return {
    dateType,
    fromDate,
    toDate,
    rangeLabel,
    applyPreset,
    setFromDate: setCustomFrom,
    setToDate: setCustomTo,
    setDateType,
  };
}
