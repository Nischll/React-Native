import LoadingState from "@/src/components/feedback/LoadingState";
import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndexPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <LoadingState />
      </SafeAreaView>
    );
  }

  return isAuthenticated ? (
    <Redirect href="/(private)/(tabs)" />
  ) : (
    <Redirect href="/(public)/login" />
  );
}
