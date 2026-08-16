import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import OvernightConciergePatrolTemplates from "@/src/screens/private/OvernightConciergePatrol/OvernightConciergePatrolTemplates";
import { View } from "react-native";

export default function OvernightConciergePatrolTemplatePage() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer key="static-container" virtualized refreshable={false}>
        <OvernightConciergePatrolTemplates key={screenRefreshKey} />
      </ScreenContainer>

      {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50" />
      )}
    </>
  );
}
