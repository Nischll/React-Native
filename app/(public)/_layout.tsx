import LoadingState from "@/src/components/feedback/LoadingState";
import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect, Slot } from "expo-router";

export default function PublicLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(private)/(tabs)" />;
  }

  return <Slot />;
}
