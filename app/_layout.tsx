import { toastConfig } from "@/src/components/ui/Toast";
import { AuthProvider } from "@/src/providers/AuthProvider";
import QueryProvider from "@/src/providers/QueryProvider";
import { PortalHost, PortalProvider } from "@gorhom/portal";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "../global.css";

function RootLayoutInner() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          freezeOnBlur: true,
          gestureEnabled: true,
          animationDuration: 220,
          contentStyle: {
            backgroundColor: "#fff",
          },
        }}
      />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PortalProvider>
        <QueryProvider>
          <SafeAreaProvider>
            <AuthProvider>
              <RootLayoutInner />
            </AuthProvider>
          </SafeAreaProvider>
        </QueryProvider>
        <PortalHost name="dropdown-host" />
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
