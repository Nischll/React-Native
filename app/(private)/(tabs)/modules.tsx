import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import Modules from "@/src/screens/private/Modules/Modules";

export default function ModulesPage() {
  const { screenRefreshKey } = useGlobalRefresh();
  return (
    <ScreenContainer key="static-container">
      <Modules key={screenRefreshKey} />
    </ScreenContainer>
  );
}
