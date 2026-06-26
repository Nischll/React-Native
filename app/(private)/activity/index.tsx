import ScreenContainer from "@/src/components/layout/ScreenContainer";
import ActivityScreen from "@/src/screens/private/Activity/Activity";

export default function ActivityPage() {
  return (
    <ScreenContainer virtualized refreshable={false}>
      <ActivityScreen />
    </ScreenContainer>
  );
}
