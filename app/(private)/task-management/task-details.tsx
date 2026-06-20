import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { TaskDetails } from "@/src/screens/private/TaskManagement/TaskDetails";

export default function TaskDetailsPage() {
  return (
    <ScreenContainer refreshable={false}>
      <TaskDetails />
    </ScreenContainer>
  );
}
