import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import PrePostInspectionDetails from "@/src/screens/private/PrePostInspection/PrePostInspectionDetails";
import { View } from "react-native";

export default function PrePostInspectionDetailsPage() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer key="static-container">
        <PrePostInspectionDetails key={screenRefreshKey} />
      </ScreenContainer>

      {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50" />
      )}
    </>
  );
}
