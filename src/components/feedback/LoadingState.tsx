import { ActivityIndicator, Text, View } from "react-native";

export default function LoadingState({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <ActivityIndicator size="large" />
      <Text className="mt-4 text-base text-slate-500">{message}</Text>
    </View>
  );
}
