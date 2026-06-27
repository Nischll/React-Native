import { useUpdateTaskStatus } from "@/src/api/taskManagement.api";
import AppButton from "@/src/components/ui/AppButton";
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

const PRIORITY_CONFIG: Record<
  string,
  { bg: string; text: string; icon: string; label: string }
> = {
  high: {
    bg: "#FCEBEB",
    text: "#501313",
    icon: "warning-outline",
    label: "High priority",
  },
  medium: {
    bg: "#FAEEDA",
    text: "#633806",
    icon: "alert-circle-outline",
    label: "Medium priority",
  },
  low: {
    bg: "#EAF3DE",
    text: "#173404",
    icon: "arrow-down-circle-outline",
    label: "Low priority",
  },
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
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
  return [first, middle, last].filter(Boolean).join(" ") || null;
}

function isPastDeadline(dateStr?: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function toDisplayCase(str?: string | null) {
  if (!str) return null;
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function TaskInformationCard({ task }: Props) {
  const queryClient = useQueryClient();
  const { taskStatus } = useTaskStatusOptions();
  const { mutate: updateStatus, isPending } = useUpdateTaskStatus(task.id);

  const priority =
    PRIORITY_CONFIG[task.priority?.toLowerCase() ?? ""] ??
    PRIORITY_CONFIG.medium;

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
  const deadlinePast = isPastDeadline(task.deadline);

  const handleStatusChange = (value: string) => {
    const newStatusId = Number(value);
    if (newStatusId === task.taskStatusId) return;
    updateStatus(
      { taskStatusId: newStatusId },
      {
        onSuccess: () => {
          queryClient.refetchQueries({
            predicate: (q) =>
              String(q.queryKey[0]).includes("/task/task-status/"),
          });
          queryClient.invalidateQueries({
            predicate: (q) => String(q.queryKey[0]).includes("/task"),
          });
        },
      },
    );
  };

  // ── Pill tag ─────────────────────────────────────────────────────
  const Tag = ({
    label,
    bg,
    color,
    borderColor,
    icon,
  }: {
    label: string;
    bg: string;
    color: string;
    borderColor: string;
    icon?: string;
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: bg,
        borderWidth: 0.5,
        borderColor,
        alignSelf: "flex-start",
      }}
    >
      {icon && <AppIcon name={icon as any} size={12} color={color} />}
      <Text style={{ fontSize: 10, fontWeight: "500", color }}>{label}</Text>
    </View>
  );

  // ── Section label ─────────────────────────────────────────────────
  const SectionLabel = ({ label }: { label: string }) => (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "600",
        color: "#94A3B8",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {label}
    </Text>
  );

  const Divider = () => (
    <View
      style={{ height: 0.5, backgroundColor: "#E2E8F0", marginVertical: 16 }}
    />
  );

  // ── Single detail row: icon | label + value ───────────────────────
  // icon on left, label above value on right — all same height as icon box
  const InfoItem = ({
    icon,
    label,
    value,
    valueColor,
  }: {
    icon: string;
    label: string;
    value?: string | null;
    valueColor?: string;
  }) => {
    if (!value) return null;
    return (
      <View
        style={{
          width: "50%",
          paddingRight: 12,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center", // ← icon and text block vertically centered
          gap: 8,
        }}
      >
        {/* Icon box */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: "#F8FAFC",
            borderWidth: 0.5,
            borderColor: "#E2E8F0",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AppIcon name={icon as any} size={15} color="#94A3B8" />
        </View>

        {/* Label + value stacked, centered against icon */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={{ fontSize: 11, color: "#94A3B8", marginBottom: 1 }}>
            {label}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: valueColor ?? "#1E293B",
              lineHeight: 17,
            }}
            numberOfLines={2}
          >
            {value}
          </Text>
        </View>
      </View>
    );
  };

  // ── Prose section ─────────────────────────────────────────────────
  const ProseSection = ({
    title,
    body,
  }: {
    title: string;
    body?: string | null;
  }) => {
    if (!body) return null;
    return (
      <View style={{ marginTop: 10 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: "#64748B",
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: "#1E293B", lineHeight: 20 }}>
          {body}
        </Text>
      </View>
    );
  };

  // ── render ────────────────────────────────────────────────────────
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: "#E2E8F0",
        padding: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 8,
        }}
      >
        {/* Tags — wrap naturally downward on the left */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            maxWidth: "75%",
          }}
        >
          <Tag
            label={priority.label}
            bg={priority.bg}
            color={priority.text}
            borderColor={priority.text + "40"}
            icon={priority.icon}
          />
          {task.area && (
            <Tag
              label={toDisplayCase(task.area)!}
              bg="#E1F5EE"
              color="#085041"
              borderColor="#9FE1CB"
            />
          )}
          {task.type && (
            <Tag
              label={toDisplayCase(task.type)!}
              bg="#EEEDFE"
              color="#3C3489"
              borderColor="#CECBF6"
            />
          )}
        </View>

        {/* Edit button — pinned to top-right */}
        <AppButton
          onPress={() =>
            router.push({
              pathname: "/(private)/task-management/task-add-edit",
              params: { mode: "edit", taskId: String(task.id) },
            })
          }
          size="sm"
          leftIcon="pencil-outline"
        >
          Edit
        </AppButton>
      </View>

      {/* ── Status ── */}
      <SectionLabel label="Task status" />
      {isPending ? (
        <View
          style={{
            borderWidth: 0.5,
            borderColor: "#E2E8F0",
            borderRadius: 8,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <ActivityIndicator size="small" />
          <Text style={{ fontSize: 13, color: "#64748B" }}>
            Updating status…
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: 4 }}>
          <SelectField
            mode="dropdown"
            options={taskStatus}
            value={String(task.taskStatusId)}
            onChange={handleStatusChange}
            placeholder="Select status"
          />
        </View>
      )}

      <Divider />

      {/* ── Details grid ── */}
      <SectionLabel label="Details" />
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <InfoItem
          icon="document-text-outline"
          label="Task number"
          value={task.taskNumber}
        />
        <InfoItem
          icon="business-outline"
          label="Building"
          value={task.buildingName}
        />
        <InfoItem
          icon="person-outline"
          label="Assigned to"
          value={assignedName}
        />
        <InfoItem
          icon="create-outline"
          label="Created by"
          value={creatorName}
        />
        <InfoItem
          icon="calendar-outline"
          label="Created"
          value={formatDate(task.createdDate)}
        />
        <InfoItem
          icon="time-outline"
          label="Deadline"
          value={formatDate(task.deadline)}
          valueColor={deadlinePast ? "#A32D2D" : undefined}
        />
        {task.residentName && (
          <InfoItem
            icon="home-outline"
            label="Resident"
            value={`${task.residentUnit ?? ""} · ${task.residentName}`}
          />
        )}
        <InfoItem
          icon="location-outline"
          label="Location"
          value={task.location}
        />
        <InfoItem icon="albums-outline" label="Sub type" value={task.subType} />
        <InfoItem
          icon="mail-outline"
          label="Mode"
          value={
            task.modeOfCommunication
              ? toDisplayCase(task.modeOfCommunication)
              : null
          }
        />
      </View>

      {/* ── Prose ── */}
      {(task.description || task.actionTaken) && <Divider />}
      <ProseSection title="Description" body={task.description} />
      <ProseSection title="Action taken" body={task.actionTaken} />
    </View>
  );
}
