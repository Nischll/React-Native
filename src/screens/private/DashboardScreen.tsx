import { useLogoutMutation } from "@/src/api/auth.api";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const { logout } = useAuth();
  const { mutate: mutatelogout } = useLogoutMutation();

  const handleLogout = () => {
    mutatelogout(undefined, {
      onSuccess: () => {
        logout();
        router.replace("/(auth)/login");
      },
    });
  };
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <View className="rounded-lg bg-blue-500 px-4 py-2">
        <Text className="text-white text-lg font-semibold">Welcome...!</Text>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-500 px-6 py-3 rounded-lg mt-4"
      >
        <Text className="text-white font-semibold text-base">Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
