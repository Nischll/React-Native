import { toastConfig } from "@/src/components/ui/Toast";
import { AuthProvider } from "@/src/providers/AuthProvider";
import QueryProvider from "@/src/providers/QueryProvider";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "../global.css";

function RootLayoutInner() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast config={toastConfig} />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (__DEV__) {
      import("@/src/devTools").then(({ initDevTools }) => {
        initDevTools();
      });
    }
  }, []);

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <AuthProvider>
          {/* <Stack screenOptions={{ headerShown: false }} />
          <Toast config={toastConfig} /> */}
          <RootLayoutInner />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
