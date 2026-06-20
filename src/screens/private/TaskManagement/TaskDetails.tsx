import { useGetTaskById } from "@/src/api/taskManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import TaskInformationCard from "./components/TaskInfoCard";

export const TaskDetails = () => {
  const { taskId } = useLocalSearchParams<{
    taskId?: string;
  }>();
  const parsedTaskId = taskId ? Number(taskId) : undefined;

  const { data: taskData, isLoading: isLoadingTask } =
    useGetTaskById(parsedTaskId);

  const task = taskData?.data?.data?.[0];

  return (
    <>
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="clipboard"
          title="Task Details"
          subtitle={
            task?.taskNumber
              ? `${task.taskNumber} • ${task.title}`
              : "View task information, status and activity"
          }
        />
        {!isLoadingTask && task && <TaskInformationCard task={task} />}
      </View>
    </>
  );
};
