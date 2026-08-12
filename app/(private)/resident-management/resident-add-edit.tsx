import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import ResidentAddEditScreen from "@/src/screens/private/ResidentManagement/ResidentAddEdit";
import { View } from "react-native";

export default function ResidentAddEditPage() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer
        key="static-container"
        scrollable={false}
        refreshable={false}
      >
        <ResidentAddEditScreen key={screenRefreshKey} />
      </ScreenContainer>

      {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50" />
      )}
    </>
  );
}
