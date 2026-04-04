import { toastConfig } from "@/src/components/ui/Toast";
import { AuthProvider } from "@/src/providers/AuthProvider";
import QueryProvider from "@/src/providers/QueryProvider";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "../global.css";

export default function RootLayout() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <Toast config={toastConfig} />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
