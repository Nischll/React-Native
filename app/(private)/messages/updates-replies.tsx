import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import { ReplySheet } from "@/src/screens/private/Updates/ReplySheet";

export default function UpdatesPage() {
  const { screenRefreshKey } = useGlobalRefresh();
  return (
    <ScreenContainer key="static-container" virtualized refreshable={false}>
      <ReplySheet key={screenRefreshKey} />
    </ScreenContainer>
  );
}
