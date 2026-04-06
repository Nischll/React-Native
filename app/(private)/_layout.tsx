import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivateLayout() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <View>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(public)/login" />;
  }

  return <Slot />;
}
