import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type MonthYearPickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** `dark` for primary headers (Home); `light` for white page backgrounds */
  variant?: "dark" | "light";
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function MonthYearPicker({
  value,
  onChange,
  placeholder = "Select Month",
  variant = "dark",
}: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const isLight = variant === "light";

  const getYearFromValue = () => {
    if (!value) return new Date().getFullYear();
    return parseInt(value.split("-")[0], 10);
  };

  const [year, setYear] = useState(() => getYearFromValue());

  const displayLabel = value
    ? (() => {
        const d = new Date(`${value}-01T12:00:00`);
        if (isNaN(d.getTime())) return value;
        return d.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
      })()
    : placeholder;

  const handleSelect = (monthIndex: number) => {
    const month = String(monthIndex + 1).padStart(2, "0");
    const formatted = `${year}-${month}`;
    onChange(formatted);
    setOpen(false);
  };

  const selectedMonthIndex = value
    ? parseInt(value.split("-")[1], 10) - 1
    : null;

  const selectedYear = value ? parseInt(value.split("-")[0], 10) : null;

  return (
    <View className="w-full">
      <Pressable
        onPress={() => {
          setYear(getYearFromValue());
          setOpen(true);
        }}
        className={`w-full flex-row items-center justify-between rounded-xl px-3 py-2 gap-2 border ${
          isLight
            ? "bg-white border-slate-200"
            : "bg-white/15 border-white/20"
        }`}
      >
        <Text
          className={`font-semibold text-sm ${
            isLight ? "text-textPrimary" : "text-white"
          }`}
        >
          {displayLabel}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={isLight ? "#334155" : "#FFFFFF"}
        />
      </Pressable>

      <Modal
        transparent
        visible={open}
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View className="flex-1 bg-black/40 justify-center px-6">
            <TouchableWithoutFeedback>
              <View className="rounded-2xl bg-white p-4 shadow-lg">
                <View className="flex-row items-center justify-between mb-3">
                  <Pressable onPress={() => setYear((y) => y - 1)}>
                    <Ionicons name="chevron-back" size={20} color="#0f172a" />
                  </Pressable>

                  <Text className="text-base font-semibold text-textPrimary">
                    {year}
                  </Text>

                  <Pressable onPress={() => setYear((y) => y + 1)}>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#0f172a"
                    />
                  </Pressable>
                </View>

                <View className="flex-row flex-wrap justify-between">
                  {MONTHS.map((m, index) => {
                    const isSelected =
                      selectedMonthIndex === index && selectedYear === year;

                    return (
                      <Pressable
                        key={m}
                        onPress={() => handleSelect(index)}
                        className={`w-[30%] mb-3 py-2 rounded-lg items-center ${
                          isSelected ? "bg-primary" : "bg-slate-100"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {m}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
