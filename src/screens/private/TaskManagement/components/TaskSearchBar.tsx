import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

interface TaskSearchBarProps {
  onSearch: (query: string) => void;
  onFilterPress?: () => void;
  debounceMs?: number;
}

export default function TaskSearchBar({
  onSearch,
  onFilterPress,
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
    <View className="mb-2 flex-row items-center gap-2">
      <View className="flex-1">
        <AppInput
          value={value}
          onChangeText={setValue}
          placeholder="Search tasks..."
          placeholderTextColor="#9CA3AF"
          className="text-sm text-gray-700"
          returnKeyType="search"
          leftIcon="search"
        />
      </View>

      <TouchableOpacity
        onPress={onFilterPress}
        className="h-12 w-12 rounded-xl border border-gray-200 bg-white items-center justify-center"
      >
        <AppIcon name="options-outline" size={20} color="#64748B" />
      </TouchableOpacity>
    </View>
  );
}
