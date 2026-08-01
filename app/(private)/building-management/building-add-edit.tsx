import ScreenContainer from "@/src/components/layout/ScreenContainer";
import BuildingAddEdit from "@/src/screens/private/BuildingManagement/BuildingAddEdit";

export default function Page() {
  return (
    <ScreenContainer virtualized refreshable={false}>
      <BuildingAddEdit />
    </ScreenContainer>
  );
}
