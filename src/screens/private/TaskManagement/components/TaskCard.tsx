import AppIcon from "@/src/components/ui/AppIcon";
import { TaskResponseData } from "@/src/types/task-management.types";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

interface TaskCardProps {
  task: TaskResponseData;
}

export default function TaskCard({ task }: TaskCardProps) {
  const PRIORITY_STYLES: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    high: { bg: "bg-red-100", text: "text-red-600", label: "High" },
    medium: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Medium" },
    low: { bg: "bg-green-100", text: "text-green-700", label: "Low" },
  };

  const priority =
    PRIORITY_STYLES[task.priority?.toLowerCase() ?? ""] ??
    PRIORITY_STYLES.medium;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/(private)/task-management/task-details",
          params: {
            taskId: String(task.id),
          },
        })
      }
      className="bg-white rounded-2xl mb-3 px-4 py-3 border border-slate-100"
      style={{
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }}
    >
      {/* Top Row */}
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <Text className="text-xs text-slate-400 font-medium">
            {task.taskNumber ?? `TASK-${task.id}`}
          </Text>

          <Text
            numberOfLines={2}
            className="text-base font-semibold text-slate-800 mt-1"
          >
            {task.title}
          </Text>
        </View>

        <AppIcon name="chevron-forward" size={18} color="#94A3B8" />
      </View>

      {/* Bottom Row */}
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center gap-3">
          {/* Priority */}
          <View className={`px-2.5 py-1 rounded-full ${priority.bg}`}>
            <Text className={`text-xs font-semibold ${priority.text}`}>
              {priority.label}
            </Text>
          </View>

          {/* Comments */}
          <View className="flex-row items-center gap-1">
            <AppIcon name="chatbubble-outline" size={14} color="#64748B" />
            <Text className="text-xs text-slate-500">
              {task.commentResponsePojoList?.length ?? 0}
            </Text>
          </View>

          {/* Attachments */}
          <View className="flex-row items-center gap-1">
            <AppIcon name="attach-outline" size={14} color="#64748B" />
            <Text className="text-xs text-slate-500">
              {task.attachmentResponsePojoList?.length ?? 0}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
