import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import Resources from "@/src/screens/private/Resources/Resources";
import { View } from "react-native";
export default function Page() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer key="static-container" virtualized refreshable={false}>
        <Resources key={screenRefreshKey} />
      </ScreenContainer>
      {refreshing && <View className="absolute inset-0 bg-black/30 items-center justify-center z-50" />}
    </>
  );
}
