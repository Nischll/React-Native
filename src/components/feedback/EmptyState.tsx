import { Text, View } from "react-native";

export default function EmptyState({
  title = "No data found",
  message = "There is nothing to display right now.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-xl font-semibold text-slate-900">{title}</Text>
      <Text className="mt-2 text-center text-slate-500">{message}</Text>
    </View>
  );
}
