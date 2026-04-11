import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import Profile from "@/src/screens/private/Profile/Profile";

export default function ProfilePage() {
  const { screenRefreshKey } = useGlobalRefresh();
  return (
    <ScreenContainer key="static-container">
      <Profile key={screenRefreshKey} />
    </ScreenContainer>
  );
}
