import LoadingState from "@/src/components/feedback/LoadingState";
import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect } from "expo-router";

export default function IndexPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  return isAuthenticated ? (
    <Redirect href="/(private)/(tabs)" />
  ) : (
    <Redirect href="/(public)/login" />
  );
}
