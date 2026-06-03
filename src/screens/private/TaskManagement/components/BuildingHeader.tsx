import AppIcon from "@/src/components/ui/AppIcon";
import { Text, View } from "react-native";

interface BuildingHeaderProps {
  buildingName: string;
}

export default function BuildingHeader({ buildingName }: BuildingHeaderProps) {
  return (
    <View className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-primary/15">
      <View className="flex-row items-center gap-2">
        <AppIcon name="business" size={18} color="#6B7280" />
        <Text className="text-sm font-medium text-gray-700">
          {buildingName}
        </Text>
      </View>
    </View>
  );
}
