import ScreenContainer from "@/src/components/layout/ScreenContainer";
import ResourceAddEdit from "@/src/screens/private/Resources/ResourceAddEdit";
export default function Page() {
  return (<ScreenContainer virtualized refreshable={false}><ResourceAddEdit /></ScreenContainer>);
}
