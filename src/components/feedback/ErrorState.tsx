import { Pressable, Text, View } from "react-native";

export default function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-xl font-semibold text-slate-900">{title}</Text>
      <Text className="mt-2 text-center text-slate-500">{message}</Text>

      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="mt-6 rounded-2xl bg-blue-600 px-6 py-4"
        >
          <Text className="font-semibold text-white">Retry</Text>
        </Pressable>
      )}
    </View>
  );
}
