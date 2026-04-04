import { AuthProvider } from "@/src/providers/AuthProvider";
import QueryProvider from "@/src/providers/QueryProvider";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
