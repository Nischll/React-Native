import ScreenContainer from "@/src/components/layout/ScreenContainer";
import TradeDirectoryAddEdit from "@/src/screens/private/TradeDirectory/TradeDirectoryAddEdit";

export default function Page() {
  return (
    <ScreenContainer virtualized refreshable={false}>
      <TradeDirectoryAddEdit />
    </ScreenContainer>
  );
}
