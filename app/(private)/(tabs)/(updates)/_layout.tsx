import { Stack } from "expo-router";

export default function UpdatesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        freezeOnBlur: true,
        gestureEnabled: true,
        animationDuration: 120,
      }}
    />
  );
}
