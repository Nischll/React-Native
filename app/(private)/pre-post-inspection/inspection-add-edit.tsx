import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import AddEditPrePostInspection from "@/src/screens/private/PrePostInspection/AddEditPrePostInspection";
import { View } from "react-native";

export default function PrePostInspectionAddEditPage() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer key="static-container">
        <AddEditPrePostInspection key={screenRefreshKey} />
      </ScreenContainer>

      {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50" />
      )}
    </>
  );
}
