import ScreenContainer from "@/src/components/layout/ScreenContainer";
import ResourceDetails from "@/src/screens/private/Resources/ResourceDetails";
export default function Page() {
  return (<ScreenContainer virtualized refreshable={false}><ResourceDetails /></ScreenContainer>);
}
