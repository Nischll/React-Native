import ScreenContainer from "@/src/components/layout/ScreenContainer";
import TaskStatusAddEdit from "@/src/screens/private/TaskStatusManagement/TaskStatusAddEdit";

export default function Page() {
  return (
    <ScreenContainer virtualized refreshable={false}>
      <TaskStatusAddEdit />
    </ScreenContainer>
  );
}
