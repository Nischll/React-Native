import ScreenContainer from "@/src/components/layout/ScreenContainer";
import AmenityAddEdit from "@/src/screens/private/AmenityManagement/AmenityAddEdit";

export default function Page() {
  return (
    <ScreenContainer virtualized refreshable={false}>
      <AmenityAddEdit />
    </ScreenContainer>
  );
}
