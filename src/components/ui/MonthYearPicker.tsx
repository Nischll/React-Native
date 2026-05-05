import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
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
}: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);

  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value + "-01");
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const getYearFromValue = () => {
    if (!value) return new Date().getFullYear();
    return parseInt(value.split("-")[0], 10);
  };

  const [year, setYear] = useState(() => getYearFromValue());

  const displayLabel = value
    ? new Date(value + "-01").toLocaleString("default", {
        month: "short",
        year: "numeric",
      })
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
    <View>
      {/* Trigger */}
      <Pressable
        onPress={() => {
          setYear(getYearFromValue());
          setOpen(true);
        }}
        className="flex-row items-center justify-between rounded-xl bg-white/15 border border-white/20 mt-3 px-4 py-2 gap-2"
      >
        <Text className="text-white font-semibold text-sm">{displayLabel}</Text>
        <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
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
            {/* Prevent closing when clicking inside */}
            <TouchableWithoutFeedback>
              <View className="rounded-2xl bg-white p-4 shadow-lg">
                {/* Year Selector */}
                <View className="flex-row items-center justify-between mb-3">
                  <Pressable onPress={() => setYear((y) => y - 1)}>
                    <Ionicons name="chevron-back" size={20} />
                  </Pressable>

                  <Text className="text-base font-semibold">{year}</Text>

                  <Pressable onPress={() => setYear((y) => y + 1)}>
                    <Ionicons name="chevron-forward" size={20} />
                  </Pressable>
                </View>

                {/* Month Grid */}
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
