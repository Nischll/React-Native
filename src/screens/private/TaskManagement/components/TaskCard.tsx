import { useUpdateTaskStatus } from "@/src/api/taskManagement.api";
import AppIcon from "@/src/components/ui/AppIcon";
import SelectField from "@/src/components/ui/SelectField";
import { useTaskStatusOptions } from "@/src/hooks/useTaskStatus";
import { TaskResponseData } from "@/src/types/task-management.types";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface TaskCardProps {
  task: TaskResponseData;
}

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  high: { bg: "bg-red-100", text: "text-red-600", label: "High" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Medium" },
  low: { bg: "bg-green-100", text: "text-green-700", label: "Low" },
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function TaskCard({ task }: TaskCardProps) {
  const queryClient = useQueryClient();
  const { taskStatus } = useTaskStatusOptions();
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateTaskStatus(task.id);

  const priority =
    PRIORITY_STYLES[task.priority?.toLowerCase() ?? ""] ??
    PRIORITY_STYLES.medium;

  const assigneeName = task.assignedTo || "—";
  const creatorName = task.createdBy || "—";

  const handleEdit = () => {
    router.push({
      pathname: "/(private)/task-management/task-add-edit",
      params: { mode: "edit", taskId: String(task.id) },
    });
  };

  const handleStatusChange = (value: string) => {
    const newStatusId = Number(value);
    if (newStatusId === task.taskStatusId) return;

    updateStatus(
      { taskStatusId: newStatusId },
      {
        onSuccess: () => {
          queryClient.refetchQueries({
            predicate: (query) =>
              String(query.queryKey[0]).includes("/task/task-status/"),
          });
        },
      },
    );
  };

  const count =
    task.commentResponsePojoList?.length +
      task.attachmentResponsePojoList?.length || 0;

  return (
    <View className="bg-slate-100 rounded-2xl mb-3 p-4 shadow-md border border-gray-100">
      {/* Top row: task code + edit icon */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-2">
          <AppIcon name="reorder-three" size={16} color="#9CA3AF" />
          <Text className="text-xs text-gray-400 font-medium">
            {task.taskNumber ?? `TASK-${task.id}`}
          </Text>
        </View>
        <TouchableOpacity onPress={handleEdit} hitSlop={8} activeOpacity={0.6}>
          <AppIcon name="pencil-outline" size={16} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Task title */}
      <Text className="text-base font-semibold text-gray-800 mb-2">
        {task.title}
      </Text>

      {/* Priority tag */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        <View className={`px-3 py-1 rounded-full ${priority.bg}`}>
          <Text className={`text-xs font-semibold ${priority.text}`}>
            {priority.label}
          </Text>
        </View>
      </View>

      {/* To / By */}
      <View className="mb-2 gap-0.5">
        <Text className="text-xs text-gray-500">
          <Text className="font-medium">To:</Text> {assigneeName}
        </Text>
        <Text className="text-xs text-gray-500">
          <Text className="font-medium">By:</Text> {creatorName}
        </Text>
      </View>

      {/* Dates row */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-row items-center gap-1">
          <AppIcon name="calendar-outline" size={13} color="#6B7280" />
          <Text className="text-xs text-gray-500">
            {formatDate(task.createdDate)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <AppIcon name="time-outline" size={13} color="#6B7280" />
          <Text className="text-xs text-gray-500">
            {formatDate(task.deadline)}
          </Text>
        </View>
      </View>

      {/* Action Taken */}
      {task.actionTaken ? (
        <View className="flex-row items-center gap-2 mb-3">
          <AppIcon name="checkbox-outline" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-600 flex-1" numberOfLines={2}>
            {task.actionTaken}
          </Text>
        </View>
      ) : null}

      {/* Status dropdown — shows spinner while update API is in flight */}
      <View className="mb-3">
        {isUpdatingStatus ? (
          <View className="border border-gray-200 rounded-xl px-3 py-3 flex-row items-center gap-2 bg-white">
            <ActivityIndicator size="small" color="#6366F1" />
            <Text className="text-xs text-gray-400">Updating status...</Text>
          </View>
        ) : (
          <SelectField
            mode="dropdown"
            options={taskStatus}
            value={String(task.taskStatusId)}
            onChange={handleStatusChange}
            placeholder="Select Status"
          />
        )}
      </View>

      {/* Description */}
      {task.description ? (
        <Text className="text-xs text-gray-500 mb-3" numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      {/* Attachments & Comments button */}
      <TouchableOpacity
        activeOpacity={0.7}
        className="border border-gray-200 bg-white rounded-xl py-2.5 flex-row justify-center items-center gap-2"
        onPress={() =>
          router.push({
            pathname: "/(private)/task-management/task-attachments-comments",
            params: { taskId: String(task.id) },
          })
        }
      >
        <AppIcon name="chatbubble-outline" size={15} color="#6B7280" />

        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs font-medium text-gray-600">
            View Attachments & Comments
          </Text>
          <View
            className={`rounded-full px-1.5 py-0.5 min-w-5 items-center bg-gray-200`}
          >
            <Text className={`text-xs font-semibold text-gray-500}`}>
              {count}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
