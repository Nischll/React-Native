import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import PrivateMessages from "@/src/screens/private/PrivateMessages/PrivateMessages";
import { View } from "react-native";

export default function PrivateMessagesPage() {
  const { screenRefreshKey, refreshing } = useGlobalRefresh();
  return (
    <>
      <ScreenContainer
        key="static-container"
        virtualized
        refreshable={false}
        padded={false}
        safeBottom={false}
      >
        <PrivateMessages key={screenRefreshKey} />
      </ScreenContainer>
      {refreshing && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50" />
      )}
    </>
  );
}
