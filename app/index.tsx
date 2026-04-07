import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
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

  if (!isAuthenticated) {
    return <Redirect href="/(public)/login" />;
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <View>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }
  return <Redirect href="/(private)/(tabs)/home" />;
}
