import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

type DatePickerFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showTime?: boolean; // ✅ NEW PROP
};

export default function DatePickerField({
  value,
  onChange,
  placeholder = "Select Date",
  showTime = false, // ✅ default safe
}: DatePickerFieldProps) {
  const [showIOS, setShowIOS] = useState(false);

  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }, [value]);

  const formatForBackend = (date: Date) => date.toISOString();

  // ✅ ANDROID HANDLER
  const handleAndroidOpen = () => {
    DateTimePickerAndroid.open({
      value: parsedDate,
      mode: "date",
      onChange: (event, selectedDate) => {
        if (event.type !== "set" || !selectedDate) return;

        // 👉 If no time needed → return immediately
        if (!showTime) {
          onChange(formatForBackend(selectedDate));
          return;
        }

        // 👉 If time needed → open time picker
        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: "time",
          onChange: (event2, selectedTime) => {
            if (event2.type !== "set" || !selectedTime) return;

            const finalDate = new Date(selectedDate);
            finalDate.setHours(
              selectedTime.getHours(),
              selectedTime.getMinutes(),
            );

            onChange(formatForBackend(finalDate));
          },
        });
      },
    });
  };

  // ✅ IOS HANDLER
  const handleIOSChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (!selectedDate) return;
    onChange(formatForBackend(selectedDate));
  };

  return (
    <View>
      <Pressable
        onPress={() => {
          if (Platform.OS === "android") {
            handleAndroidOpen();
          } else {
            setShowIOS(true);
          }
        }}
        className="flex-row items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3"
      >
        <Text className="text-slate-900">
          {value ? new Date(value).toLocaleString() : placeholder}
        </Text>

        <Ionicons name="calendar-outline" size={20} color="#64748b" />
      </Pressable>

      {/* ✅ IOS */}
      {Platform.OS === "ios" && showIOS && (
        <View className="mt-3 rounded-xl border border-slate-200 bg-white p-2">
          <DateTimePicker
            value={parsedDate}
            mode={showTime ? "datetime" : "date"} // ✅ dynamic
            display="spinner"
            onChange={handleIOSChange}
          />

          <Pressable
            onPress={() => setShowIOS(false)}
            className="mt-2 rounded-lg bg-primary py-3"
          >
            <Text className="text-center font-semibold text-white">Done</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
