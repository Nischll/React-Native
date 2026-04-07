import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface ModuleCardProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}

export default function ModuleCard({ title, icon, onPress }: ModuleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-3xl bg-white p-5 shadow-sm"
    >
      <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
        <Ionicons name={icon} size={24} color="#2563eb" />
      </View>

      <Text className="text-base font-semibold text-slate-900">{title}</Text>
    </Pressable>
  );
}
