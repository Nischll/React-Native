import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import Home from "@/src/screens/private/Home";

export default function HomePage() {
  const { screenRefreshKey } = useGlobalRefresh();
  return (
    <ScreenContainer key="static-container">
      <Home key={screenRefreshKey} />
    </ScreenContainer>
  );
}
