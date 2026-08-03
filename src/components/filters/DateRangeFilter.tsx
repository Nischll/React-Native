import DatePickerField from "@/src/components/ui/DatePickerField";
import { DateRangePreset } from "@/src/hooks/useDateRangeFilter";
import { Text, TouchableOpacity, View } from "react-native";

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

type DateRangeFilterProps = {
  dateType: DateRangePreset;
  fromDate?: string;
  toDate?: string;
  onPresetChange: (type: DateRangePreset) => void;
  onFromDateChange: (value?: string) => void;
  onToDateChange: (value?: string) => void;
  /** Optional caption under the chips */
  showRangeLabel?: boolean;
  className?: string;
};

export default function DateRangeFilter({
  dateType,
  fromDate,
  toDate,
  onPresetChange,
  onFromDateChange,
  onToDateChange,
  showRangeLabel = true,
  className = "",
}: DateRangeFilterProps) {
  const rangeLabel =
    fromDate && toDate
      ? fromDate === toDate
        ? fromDate
        : `${fromDate} → ${toDate}`
      : "";

  return (
    <View className={className}>
      <Text className="text-sm font-medium text-gray-700 mb-2">Date Range</Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {PRESETS.map((item) => {
          const active = dateType === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => onPresetChange(item.key)}
              className={`px-3 py-1.5 rounded-full ${
                active ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-white" : "text-gray-600"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {dateType === "custom" && (
        <View className="gap-2 mb-2">
          <DatePickerField
            value={fromDate}
            onChange={(v) => onFromDateChange(v?.split("T")[0])}
            placeholder="From Date"
          />
          <DatePickerField
            value={toDate}
            onChange={(v) => onToDateChange(v?.split("T")[0])}
            placeholder="To Date"
          />
        </View>
      )}

      {showRangeLabel && !!rangeLabel && (
        <Text className="text-[11px] text-slate-500">{rangeLabel}</Text>
      )}
    </View>
  );
}
