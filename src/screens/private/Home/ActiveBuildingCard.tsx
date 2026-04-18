import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { Text, View } from "react-native";

export default function ActiveBuildingCard() {
  const { selectedBuilding, openBuildingSelectDialog } = useAuth();

  return (
    <View className="flex-row items-center justify-between py-5">
      {/* LEFT SIDE */}
      <View className="flex-1 pr-4">
        {/* Title */}
        <Text className="text-sm font-semibold text-white/80">
          Active Building
        </Text>

        {/* Building Name */}
        <Text className="mt-1 text-md font-bold text-white">
          {selectedBuilding?.label || "No building selected"}
        </Text>

        {/* Button */}
        <AnimatedPressable
          onPress={openBuildingSelectDialog}
          className="mt-3 self-start rounded-xl bg-white/15 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">
            Change Building
          </Text>
        </AnimatedPressable>
      </View>

      {/* RIGHT SIDE - HEXAGON ICON */}
      <View className="h-24 w-24 items-center justify-center">
        <View
          className="absolute h-full w-full bg-white"
          style={{
            // transform: [{ rotate: "45deg" }],
            borderRadius: 100,
          }}
        />

        {/* Icon on top */}
        <AppIcon name="business-outline" size={50} color="#453956" />
      </View>
    </View>
  );
}
