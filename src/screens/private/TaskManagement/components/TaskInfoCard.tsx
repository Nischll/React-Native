import { useUpdateTaskStatus } from "@/src/api/taskManagement.api";
import AppIcon from "@/src/components/ui/AppIcon";
import SelectField from "@/src/components/ui/SelectField";
import { useTaskStatusOptions } from "@/src/hooks/useTaskStatus";
import { TaskResponseData } from "@/src/types/task-management.types";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

interface Props {
  task: TaskResponseData;
}

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  high: {
    bg: "bg-red-100",
    text: "text-red-600",
    label: "High",
  },
  medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    label: "Medium",
  },
  low: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Low",
  },
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function buildFullName(
  first?: string | null,
  middle?: string | null,
  last?: string | null,
) {
  return [first, middle, last].filter(Boolean).join(" ") || "—";
}

export default function TaskInformationCard({ task }: Props) {
  const queryClient = useQueryClient();

  const { taskStatus } = useTaskStatusOptions();

  const { mutate: updateStatus, isPending } = useUpdateTaskStatus(task.id);

  const priority =
    PRIORITY_STYLES[task.priority?.toLowerCase() ?? ""] ??
    PRIORITY_STYLES.medium;

  const assignedName = buildFullName(
    task.assignedFirstName,
    task.assignedMiddleName,
    task.assignedLastName,
  );

  const creatorName = buildFullName(
    task.creatorFirstName,
    task.creatorMiddleName,
    task.creatorLastName,
  );

  const handleStatusChange = (value: string) => {
    const newStatusId = Number(value);

    if (newStatusId === task.taskStatusId) return;

    updateStatus(
      {
        taskStatusId: newStatusId,
      },
      {
        onSuccess: () => {
          queryClient.refetchQueries({
            predicate: (query) =>
              String(query.queryKey[0]).includes("/task/task-status/"),
          });

          queryClient.invalidateQueries({
            predicate: (query) => String(query.queryKey[0]).includes("/task"),
          });
        },
      },
    );
  };

  const InfoItem = ({
    icon,
    label,
    value,
  }: {
    icon: string;
    label: string;
    value?: string | null;
  }) => {
    if (!value) return null;

    return (
      <View className="w-[48%] mb-4">
        <View className="flex-row items-center gap-1 mb-1">
          <AppIcon name={icon as any} size={14} color="#94A3B8" />

          <Text className="text-xs text-slate-400">{label}</Text>
        </View>

        <Text className="text-sm text-slate-700" numberOfLines={2}>
          {value}
        </Text>
      </View>
    );
  };

  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4">
      {/* Priority */}
      <View className="flex-row items-center justify-between mb-5">
        <View className={`px-3 py-1 rounded-full ${priority.bg}`}>
          <Text className={`text-xs font-semibold ${priority.text}`}>
            {priority.label}
          </Text>
        </View>

        <Text
          onPress={() =>
            router.push({
              pathname: "/(private)/task-management/task-add-edit",
              params: {
                mode: "edit",
                taskId: String(task.id),
              },
            })
          }
          className="text-primary font-medium"
        >
          Edit
        </Text>
      </View>

      {/* Status */}
      <View className="mb-5">
        <Text className="text-xs text-slate-400 mb-2">Task Status</Text>

        {isPending ? (
          <View className="border border-slate-200 rounded-xl p-3 flex-row items-center gap-2">
            <ActivityIndicator size="small" />

            <Text className="text-sm text-slate-500">Updating status...</Text>
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

      {/* INFORMATION */}
      <Text className="text-base font-semibold text-slate-800 mb-2">
        Information
      </Text>

      <View className="flex-row flex-wrap justify-between">
        <InfoItem
          icon="document-text-outline"
          label="Task Number"
          value={task.taskNumber}
        />
        <InfoItem
          icon="business-outline"
          label="Building"
          value={task.buildingName}
        />
        <InfoItem
          icon="person-outline"
          label="Assigned To"
          value={assignedName}
        />
        <InfoItem
          icon="create-outline"
          label="Created By"
          value={creatorName}
        />
        <InfoItem
          icon="home-outline"
          label="Resident"
          value={
            task.residentName
              ? `${task.residentUnit ?? ""} - ${task.residentName}`
              : undefined
          }
        />
        <InfoItem
          icon="location-outline"
          label="Location"
          value={task.location}
        />
        <InfoItem icon="grid-outline" label="Area" value={task.area} />
        <InfoItem icon="layers-outline" label="Type" value={task.type} />
        <InfoItem icon="albums-outline" label="Sub Type" value={task.subType} />
        <InfoItem
          icon="calendar-outline"
          label="Created Date"
          value={formatDate(task.createdDate)}
        />
        <InfoItem
          icon="time-outline"
          label="Deadline"
          value={formatDate(task.deadline)}
        />
      </View>
      {/* DESCRIPTION */}
      {task.description ? (
        <>
          <View className="">
            <Text className="text-base font-semibold text-slate-800">
              Description
            </Text>

            <Text className="text-sm text-slate-600 mt-2 leading-5">
              {task.description}
            </Text>
          </View>
        </>
      ) : null}
      {/* ACTION TAKEN */}
      {task.actionTaken ? (
        <>
          <View className="my-4">
            <Text className="text-base font-semibold text-slate-800">
              Action Taken
            </Text>

            <Text className="text-sm text-slate-600 mt-2 leading-5">
              {task.actionTaken}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
