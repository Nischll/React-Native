import ScreenContainer from "@/src/components/layout/ScreenContainer";
import { TaskAttachmentsComments } from "@/src/screens/private/TaskManagement/TaskAttachments";

export default function TaskAttachementsCommentsPage() {
  return (
    <ScreenContainer scrollable={false} refreshable={false}>
      <TaskAttachmentsComments />
    </ScreenContainer>
  );
}
