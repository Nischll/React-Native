import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import PrePostInspection from "@/src/screens/private/PrePostInspection/PrePostInspection";
import { View } from "react-native";

export default function PrePostInspectionPage() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer key="static-container" virtualized refreshable={false}>
        <PrePostInspection key={screenRefreshKey} />
      </ScreenContainer>

      {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50" />
      )}
    </>
  );
}
