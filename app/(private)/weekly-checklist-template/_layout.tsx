import { Stack } from "expo-router";

export default function WeeklyChecklistTemplateLayout() {
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
