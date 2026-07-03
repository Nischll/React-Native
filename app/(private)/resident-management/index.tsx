import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import ResidentDetails from "@/src/screens/private/ResidentManagement/ResidentDetails";
import { View } from "react-native";

export default function ResidentManagementPage() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer
        key="static-container"
        scrollable={false}
        refreshable={false}
      >
        <ResidentDetails key={screenRefreshKey} />
      </ScreenContainer>

      {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50">
          {/* <ActivityIndicator size="large" color="#2563eb" /> */}
        </View>
      )}
    </>
  );
}
