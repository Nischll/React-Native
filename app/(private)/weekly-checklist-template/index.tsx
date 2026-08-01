import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import ChecklistTemplates from "@/src/screens/private/Checklist/ChecklistTemplates";
import { View } from "react-native";

export default function WeeklyChecklistTemplatePage() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer key="static-container" virtualized refreshable={false}>
        <ChecklistTemplates key={screenRefreshKey} period="weekly" />
      </ScreenContainer>

      {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50">
          {/* <ActivityIndicator size="large" color="#2563eb" /> */}
        </View>
      )}
    </>
  );
}
