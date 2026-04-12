import { View } from "react-native";

export const SkeletonCard = () => {
  return (
    <View className="mb-3 rounded-2xl border border-gray-200 bg-white p-4">
      {/* Header skeleton */}
      <View className="flex-row justify-between mb-3">
        <View className="h-5 w-2/3 rounded bg-gray-200" />
        <View className="h-6 w-6 rounded bg-gray-200" />
      </View>

      {/* Lines skeleton */}
      <View className="space-y-3">
        <View className="h-4 w-full rounded bg-gray-100" />
        <View className="h-4 w-5/6 rounded bg-gray-100" />
        <View className="h-4 w-4/6 rounded bg-gray-100" />
      </View>
    </View>
  );
};
