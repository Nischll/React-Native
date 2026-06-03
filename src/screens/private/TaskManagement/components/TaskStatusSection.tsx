import { useGetTaskByStatusId } from "@/src/api/taskManagement.api";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import TaskCard from "./TaskCard";

interface TaskStatusSectionProps {
  statusId: number;
  isVisible: boolean;
  search?: string;
  buildingId?: number;
  onCountResolved?: (statusId: number, count: number) => void;
}

export default function TaskStatusSection({
  statusId,
  isVisible,
  search,
  buildingId,
  onCountResolved,
}: TaskStatusSectionProps) {
  const { data, isLoading, isError } = useGetTaskByStatusId(
    statusId,
    1,
    50,
    search,
    undefined,
    buildingId,
    isVisible,
  );

  const tasks = data?.data?.data ?? [];
  const total = data?.data?.total ?? tasks.length;

  useEffect(() => {
    if (data !== undefined && onCountResolved) {
      onCountResolved(statusId, total);
    }
  }, [data, total, statusId]);

  if (!isVisible) return null;

  if (isLoading) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator size="small" color="#6366F1" />
        <Text className="text-xs text-gray-400 mt-2">Loading tasks...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center py-10">
        <Text className="text-sm text-red-400">Failed to load tasks.</Text>
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View className="items-center py-14">
        <Text className="text-sm text-gray-400">No tasks found.</Text>
      </View>
    );
  }

  return (
    <View className="pt-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      <Text className="text-center text-xs text-gray-400 pb-6 pt-1">
        No more data to load
      </Text>
    </View>
  );
}
