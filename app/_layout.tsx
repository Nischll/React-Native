import QueryProvider from "@/src/providers/QueryProvider";
import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryProvider>
  );
}
