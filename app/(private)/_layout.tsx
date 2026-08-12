import LoadingState from "@/src/components/feedback/LoadingState";
import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect, Stack } from "expo-router";

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
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
        freezeOnBlur: true,
        gestureEnabled: true,
        animationDuration: 220,
      }}
    />
  );
}
