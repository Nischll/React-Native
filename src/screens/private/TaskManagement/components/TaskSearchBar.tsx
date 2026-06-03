import AppInput from "@/src/components/ui/AppInput";
import { useEffect, useState } from "react";
import { View } from "react-native";

interface TaskSearchBarProps {
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export default function TaskSearchBar({
  onSearch,
  debounceMs = 500,
}: TaskSearchBarProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  return (
    <View className="mb-2 flex-row items-center ">
      <AppInput
        value={value}
        onChangeText={setValue}
        placeholder="Search tasks..."
        placeholderTextColor="#9CA3AF"
        className="flex-1 text-sm text-gray-700"
        returnKeyType="search"
        leftIcon="search"
      />
    </View>
  );
}
