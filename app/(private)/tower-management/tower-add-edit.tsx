import ScreenContainer from "@/src/components/layout/ScreenContainer";
import TowerAddEdit from "@/src/screens/private/TowerManagement/TowerAddEdit";

export default function Page() {
  return (
    <ScreenContainer virtualized refreshable={false}>
      <TowerAddEdit />
    </ScreenContainer>
  );
}
