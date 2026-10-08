import LoadingState from "@/src/components/feedback/LoadingState";
import TaskAiChatDock from "@/src/screens/private/TaskManagement/components/TaskAiChatDock";
import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect, Stack, useSegments } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivateLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/login" />;
  }

  // Stack (not Slot) so navigating to sibling modules (e.g. tenant from
  // resident edit) keeps the previous screen in history for Back.
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          freezeOnBlur: true,
          gestureEnabled: true,
          animationDuration: 220,
        }}
      />
      <GlobalAssistDock />
    </View>
  );
}

function GlobalAssistDock() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const onTabs = segments.includes("(tabs)" as never);
  const tabBarHeight = 60 + (Platform.OS === "android" ? insets.bottom : 0);
  // Stack screens keep a bottom-right add button; sit the dock above it.
  const bottomReserve = onTabs ? tabBarHeight : insets.bottom + 88;

  return <TaskAiChatDock bottomReserve={bottomReserve} />;
}
