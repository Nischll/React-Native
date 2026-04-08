import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-slate-800">404</Text>
        <Text className="mt-4 text-2xl font-semibold text-slate-900">
          Screen not found
        </Text>
        <Text className="mt-2 text-center text-base text-slate-500">
          The page you are looking for doesn’t exist or may have been moved.
        </Text>

        <Pressable
          onPress={() => router.replace("/(private)/(tabs)")}
          className="mt-8 rounded-2xl bg-blue-600 px-6 py-4"
        >
          <Text className="font-semibold text-white">Go to Dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
