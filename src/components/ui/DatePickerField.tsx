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
};

export default function DatePickerField({
  value,
  onChange,
  placeholder = "Select Pickup Date & Time",
}: DatePickerFieldProps) {
  const [showIOS, setShowIOS] = useState(false);

  const parsedDate = useMemo(() => {
    if (!value) return new Date();

    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }, [value]);

  const formatForBackend = (date: Date) => date.toISOString().slice(0, 16);

  const handleAndroidOpen = () => {
    DateTimePickerAndroid.open({
      value: parsedDate,
      mode: "date",
      maximumDate: new Date(),
      is24Hour: false,
      onChange: (event, selectedDate) => {
        if (event.type === "dismissed" || !selectedDate) return;
        onChange(formatForBackend(selectedDate));
      },
    });
  };

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

      {Platform.OS === "ios" && showIOS && (
        <View className="mt-3 rounded-xl border border-slate-200 bg-white p-2">
          <DateTimePicker
            value={parsedDate}
            mode="datetime"
            display="spinner"
            maximumDate={new Date()}
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
