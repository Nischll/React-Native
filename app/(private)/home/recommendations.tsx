import ScreenContainer from "@/src/components/layout/ScreenContainer";
import Recommendations from "@/src/screens/private/Recommendations/Recommendations";
export default function Page() {
  return (<ScreenContainer virtualized refreshable={false}><Recommendations /></ScreenContainer>);
}
