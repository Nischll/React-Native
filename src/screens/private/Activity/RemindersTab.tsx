import { useGetReminders } from "@/src/api/activity.api,";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import AppIcon from "@/src/components/ui/AppIcon";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  DashboardBookingReminder,
  DashboardPreventiveMaintenanceReminder,
  DashboardReminderPeriod,
  DashboardRemindersResponse,
  DashboardTaskReminder,
  DashboardTradeVisitReminder,
} from "@/src/types/activity.types";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

type ReminderSection = {
  key: string;
  title: string;
  icon: string;
  items: React.ReactNode[];
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  CONFIRM: { bg: "#E7F3EA", text: "#1E7C3A" },
  CONFIRMED: { bg: "#E7F3EA", text: "#1E7C3A" },
  PENDING: { bg: "#FAEEDA", text: "#854F0B" },
  CANCELLED: { bg: "#FCEBEB", text: "#A32D2D" },
  COMPLETED: { bg: "#E7F3EA", text: "#1E7C3A" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status.toUpperCase()] ?? {
    bg: "#EFF1F4",
    text: "#475569",
  };
  return (
    <View className="rounded px-2 py-0.5" style={{ backgroundColor: style.bg }}>
      <Text
        className="text-[10px] font-semibold capitalize"
        style={{ color: style.text }}
      >
        {status.toLowerCase()}
      </Text>
    </View>
  );
}

export function RemindersTab() {
  const { buildingId } = useAuth();
  const [period, setPeriod] = useState<DashboardReminderPeriod>("today");

  const { data, isLoading, refetch, isRefetching } = useGetReminders(
    buildingId ?? undefined,
    period,
  );

  const reminders = data?.data;

  const sections: ReminderSection[] = reminders ? buildSections(reminders) : [];

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <View className="flex-1">
      {/* Period toggle */}
      <View className="flex-row mx-4 my-3 bg-white border border-gray-200 rounded-xl p-1 gap-1">
        {(["today", "weekly"] as DashboardReminderPeriod[]).map((p) => (
          <Pressable key={p} onPress={() => setPeriod(p)} className="flex-1">
            <View
              className={`py-2 rounded-lg items-center  ${
                period === p ? "bg-primary" : ""
              }`}
            >
              <Text
                className={`text-xs font-semibold capitalize ${
                  period === p ? "text-white" : "text-textSecondary"
                }`}
              >
                {p === "today" ? "Today" : "This week"}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : totalItems === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <AppIcon name="alarm-outline" size={36} color="#CBD5E1" />
          <Text className="text-sm text-slate-400">
            {period === "today" ? "Nothing due today" : "Nothing due this week"}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {sections.map((section) =>
            section.items.length === 0 ? null : (
              <View key={section.key} className="mb-4">
                {/* Section header */}
                <View className="flex-row items-center gap-2 px-4 mb-2">
                  <AppIcon
                    name={section.icon as any}
                    size={13}
                    color="#64748B"
                  />
                  <Text className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </Text>
                  <View className="bg-slate-200 rounded-full w-4 h-4 items-center justify-center ml-1">
                    <Text className="text-[8px] font-bold text-slate-600">
                      {section.items.length}
                    </Text>
                  </View>
                </View>
                <View className="px-4 gap-2">{section.items}</View>
              </View>
            ),
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Builders ───────────────────────────────────────────────────────────────

function buildSections(
  reminders: DashboardRemindersResponse,
): ReminderSection[] {
  return [
    {
      key: "tasks",
      title: "Tasks",
      icon: "checkbox-outline",
      items: reminders.tasks.map((t) => <TaskCard key={t.id} item={t} />),
    },
    {
      key: "bookings",
      title: "Bookings",
      icon: "calendar-outline",
      items: reminders.bookings.map((b) => <BookingCard key={b.id} item={b} />),
    },
    {
      key: "preventiveMaintenance",
      title: "Preventive maintenance",
      icon: "build-outline",
      items: reminders.preventiveMaintenance.map((m) => (
        <MaintenanceCard key={m.id} item={m} />
      )),
    },
    {
      key: "tradeVisits",
      title: "Trade visits",
      icon: "construct-outline",
      items: reminders.tradeVisits.map((v) => (
        <TradeVisitCard key={v.id} item={v} />
      )),
    },
  ];
}

// ─── Item cards ──────────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  HIGH: { bg: "#FCEBEB", text: "#A32D2D", label: "High" },
  MEDIUM: { bg: "#FAEEDA", text: "#854F0B", label: "Medium" },
  LOW: { bg: "#EAF3DE", text: "#3B6D11", label: "Low" },
};

function TaskCard({ item }: { item: DashboardTaskReminder }) {
  const priority = item.priority ? PRIORITY_STYLE[item.priority] : null;
  return (
    <View className="bg-white rounded-xl border border-blue-100 p-3 flex-row items-center gap-3">
      <AppIcon name="checkbox-outline" size={18} color="#185FA5" />
      <View className="flex-1">
        <Text
          className="text-sm font-medium text-textPrimary"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text className="text-[11px] text-blue-600 mt-0.5">
          {[item.taskNumber, item.statusName, formatDateTime(item.deadline)]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      {priority && (
        <View
          className="rounded px-2 py-0.5"
          style={{ backgroundColor: priority.bg }}
        >
          <Text
            className="text-[10px] font-semibold"
            style={{ color: priority.text }}
          >
            {priority.label}
          </Text>
        </View>
      )}
    </View>
  );
}

function BookingCard({ item }: { item: DashboardBookingReminder }) {
  const start = formatDateTime(item.startDate);
  const end = item.endDate ? formatDateTime(item.endDate) : null;

  return (
    <View className="bg-white rounded-xl border border-blue-100 p-3 flex-row items-center gap-3">
      <AppIcon name="calendar-outline" size={18} color="#185FA5" />
      <View className="flex-1">
        <Text
          className="text-sm font-medium text-textPrimary"
          numberOfLines={1}
        >
          {item.amenityName ?? item.title ?? "Booking"}
        </Text>
        <Text className="text-[11px] text-blue-600 mt-0.5">
          {[item.towerName, end ? `${start} – ${end}` : start]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      {item.status && <StatusBadge status={item.status} />}
    </View>
  );
}

function MaintenanceCard({
  item,
}: {
  item: DashboardPreventiveMaintenanceReminder;
}) {
  return (
    <View className="bg-white rounded-xl border border-blue-100 p-3 flex-row items-center gap-3">
      <AppIcon name="build-outline" size={18} color="#185FA5" />
      <View className="flex-1">
        <Text
          className="text-sm font-medium text-textPrimary"
          numberOfLines={1}
        >
          {item.maintenanceItem ?? "Maintenance"}
        </Text>
        {item.reminderMonth && (
          <Text className="text-[11px] text-blue-600 mt-0.5">
            {item.reminderMonth}
          </Text>
        )}
      </View>
    </View>
  );
}

function TradeVisitCard({ item }: { item: DashboardTradeVisitReminder }) {
  return (
    <View className="bg-white rounded-xl border border-blue-100 p-3 flex-row items-center gap-3">
      <AppIcon name="construct-outline" size={18} color="#185FA5" />
      <View className="flex-1">
        <Text
          className="text-sm font-medium text-textPrimary"
          numberOfLines={1}
        >
          {item.tradeName ?? "Trade visit"}
        </Text>
        <Text className="text-[11px] text-blue-600 mt-0.5">
          {[
            item.company,
            formatDateTime(item.scheduledAppointmentAt),
            item.lifecycleStatus,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      {item.status && <StatusBadge status={item.status} />}
    </View>
  );
}
