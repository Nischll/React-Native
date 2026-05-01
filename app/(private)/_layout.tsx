import LoadingState from "@/src/components/feedback/LoadingState";
import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect, Slot } from "expo-router";

export default function PrivateLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/login" />;
  }

  return <Slot />;
}
