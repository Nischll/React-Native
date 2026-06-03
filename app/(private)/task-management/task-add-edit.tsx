import ScreenContainer from "@/src/components/layout/ScreenContainer";
import TaskAddEdit from "@/src/screens/private/TaskManagement/components/TaskAddEdit";

export default function TaskAddEditPage() {
  return (
    <ScreenContainer scrollable={false} refreshable={false}>
      <TaskAddEdit />
    </ScreenContainer>
  );
}
