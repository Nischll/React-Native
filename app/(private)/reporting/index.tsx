import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import Reporting from "@/src/screens/private/Reporting/Reporting";
import { View } from "react-native";
export default function Page() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer key="static-container" virtualized refreshable={false}>
        <Reporting key={screenRefreshKey} />
      </ScreenContainer>
      {refreshing && <View className="absolute inset-0 bg-black/30 items-center justify-center z-50" />}
    </>
  );
}
