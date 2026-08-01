import ScreenContainer from "@/src/components/layout/ScreenContainer";
import CategoryAddEdit from "@/src/screens/private/CategoryManagement/CategoryAddEdit";

export default function Page() {
  return (
    <ScreenContainer virtualized refreshable={false}>
      <CategoryAddEdit />
    </ScreenContainer>
  );
}
