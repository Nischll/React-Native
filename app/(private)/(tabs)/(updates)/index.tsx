import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import Updates from "@/src/screens/private/Updates/Updates";

export default function UpdatesPage() {
  const { screenRefreshKey } = useGlobalRefresh();
  return (
    <ScreenContainer
      key="static-container"
      virtualized
      refreshable={false}
      padded={false}
      safeBottom={false}
    >
      <Updates key={screenRefreshKey} />
    </ScreenContainer>
  );
}
