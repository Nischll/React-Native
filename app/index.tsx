import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/login"} />;
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <View>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    ); // show spinner if needed
  }

  return (
    <Redirect
      href={isAuthenticated ? "/(dashboard)/dashboard" : "/(auth)/login"}
    />
  );
}
