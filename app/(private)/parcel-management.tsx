import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import ParcelManagement from "@/src/screens/private/ParcelManagement";

export default function ParcelManagementPage() {
  const { screenRefreshKey } = useGlobalRefresh();
  return (
    <ScreenContainer key="static-container">
      <ParcelManagement key={screenRefreshKey} />
    </ScreenContainer>
  );
}
