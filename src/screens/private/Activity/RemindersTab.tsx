import { useGetReminders } from "@/src/api/activity.api";
import { useGetParcels } from "@/src/api/parcelManagement.api";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import ListPager from "@/src/components/layout/ListPager";
import AppIcon from "@/src/components/ui/AppIcon";
import { formatDateTime } from "@/src/helper/formatDateTime";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  DashboardBookingReminder,
  DashboardParcelReminder,
  DashboardPreventiveMaintenanceReminder,
  DashboardReminderPeriod,
  DashboardRemindersResponse,
  DashboardTaskReminder,
  DashboardTradeVisitReminder,
} from "@/src/types/activity.types";
import { ParcelResponse } from "@/src/types/parcelManagement.types";
import { PAGE_SIZE } from "@/src/utils/listPagination";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

type ReminderKind =
  | "task"
  | "booking"
  | "trade"
  | "parcel"
  | "maintenance";

type FlatReminderItem =
  | { kind: "task"; id: string; data: DashboardTaskReminder }
  | { kind: "booking"; id: string; data: DashboardBookingReminder }
  | { kind: "trade"; id: string; data: DashboardTradeVisitReminder }
  | { kind: "parcel"; id: string; data: DashboardParcelReminder }
  | {
      kind: "maintenance";
      id: string;
      data: DashboardPreventiveMaintenanceReminder;
    };

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  CONFIRM: { bg: "#E7F3EA", text: "#1E7C3A" },
  CONFIRMED: { bg: "#E7F3EA", text: "#1E7C3A" },
  PENDING: { bg: "#FAEEDA", text: "#854F0B" },
  CANCELLED: { bg: "#FCEBEB", text: "#A32D2D" },
  COMPLETED: { bg: "#E7F3EA", text: "#1E7C3A" },
  BOOKED: { bg: "#E7F3EA", text: "#1E7C3A" },
  RECEIVED: { bg: "#FAEEDA", text: "#854F0B" },
  DELIVERED: { bg: "#E7F3EA", text: "#1E7C3A" },
};

const KIND_META: Record<
  ReminderKind,
  { label: string; icon: string; color: string }
> = {
  task: { label: "Task", icon: "checkbox-outline", color: "#185FA5" },
  booking: { label: "Booking", icon: "calendar-outline", color: "#185FA5" },
  trade: { label: "Trade visit", icon: "construct-outline", color: "#185FA5" },
  parcel: { label: "Parcel", icon: "cube-outline", color: "#185FA5" },
  maintenance: {
    label: "Maintenance",
    icon: "build-outline",
    color: "#185FA5",
  },
};

const PRIORITY_STYLE: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  HIGH: { bg: "#FCEBEB", text: "#A32D2D", label: "High" },
  MEDIUM: { bg: "#FAEEDA", text: "#854F0B", label: "Medium" },
  LOW: { bg: "#EAF3DE", text: "#3B6D11", label: "Low" },
};

function StatusBadge({ status }: { status?: string | null }) {
  if (status == null || typeof status !== "string" || !status.trim()) {
    return null;
  }
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
        {status.replace(/_/g, " ").toLowerCase()}
      </Text>
    </View>
  );
}

function asList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Matches backend: today, or calendar week Monday–Sunday. */
function getPeriodRange(period: DashboardReminderPeriod): {
  fromDate: string;
  toDate: string;
} {
  const today = new Date();
  if (period === "today") {
    const s = toIsoDate(today);
    return { fromDate: s, toDate: s };
  }
  const day = today.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { fromDate: toIsoDate(monday), toDate: toIsoDate(sunday) };
}

function mapParcelToReminder(p: ParcelResponse): DashboardParcelReminder {
  return {
    id: p.id,
    trackingId: p.trackingId,
    residentName: p.residentName,
    unit: p.unit,
    courier: p.courier,
    status: p.status,
    receivedTime: p.receivedTime ?? p.createdDate,
    location: p.location,
  };
}

function flattenReminders(
  reminders: DashboardRemindersResponse | null | undefined,
  parcels: DashboardParcelReminder[],
): FlatReminderItem[] {
  const tasks = asList(reminders?.tasks).map((data) => ({
    kind: "task" as const,
    id: `task-${data.id}`,
    data,
  }));
  const bookings = asList(reminders?.bookings).map((data) => ({
    kind: "booking" as const,
    id: `booking-${data.id}`,
    data,
  }));
  const trades = asList(reminders?.tradeVisits).map((data) => ({
    kind: "trade" as const,
    id: `trade-${data.id}`,
    data,
  }));
  const parcelItems = parcels.map((data) => ({
    kind: "parcel" as const,
    id: `parcel-${data.id}`,
    data,
  }));
  const maintenance = asList(reminders?.preventiveMaintenance).map((data) => ({
    kind: "maintenance" as const,
    id: `pm-${data.id}-${data.reminderMonth ?? ""}`,
    data,
  }));

  // Order matches web: Tasks → Bookings → Maintenance → Trade visits, then Parcels
  return [...tasks, ...bookings, ...maintenance, ...trades, ...parcelItems];
}

export function RemindersTab() {
  const { buildingId } = useAuth();
  const [period, setPeriod] = useState<DashboardReminderPeriod>("today");
  const [page, setPage] = useState(1);

  const range = useMemo(() => getPeriodRange(period), [period]);

  const todayQuery = useGetReminders(buildingId ?? undefined, "today");
  const weeklyQuery = useGetReminders(buildingId ?? undefined, "weekly");
  const activeQuery = period === "today" ? todayQuery : weeklyQuery;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    isRefetching,
  } = activeQuery;

  const reminders = data?.data;
  const fromDate = reminders?.fromDate || range.fromDate;
  const toDate = reminders?.toDate || range.toDate;

  const {
    data: parcelsData,
    isLoading: parcelsLoading,
    isFetching: parcelsFetching,
    isError: parcelsError,
    refetch: refetchParcels,
    isRefetching: parcelsRefetching,
  } = useGetParcels(
    {
      page: 1,
      limit: 100,
      buildingId: buildingId ?? undefined,
      fromDate,
      toDate,
    },
    buildingId != null,
  );

  const parcelReminders = useMemo(() => {
    const rows = parcelsData?.data?.data ?? [];
    // Actionable parcels awaiting pickup (same idea as web ops reminders)
    return rows
      .filter((p) => (p.status ?? "RECEIVED") !== "DELIVERED")
      .map(mapParcelToReminder);
  }, [parcelsData]);

  const allItems = useMemo(
    () => flattenReminders(reminders, parcelReminders),
    [reminders, parcelReminders],
  );
  const total = allItems.length;

  useEffect(() => {
    setPage(1);
  }, [period, buildingId]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
    if (page > maxPage) setPage(maxPage);
  }, [total, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return allItems.slice(start, start + PAGE_SIZE);
  }, [allItems, page]);

  const showLoading =
    buildingId != null &&
    ((isLoading || (isFetching && !reminders)) ||
      (parcelsLoading && !parcelsData));

  const handleRefresh = () => {
    refetch();
    refetchParcels();
  };

  return (
    <View className="flex-1">
      <View className="flex-row mx-4 my-3 bg-white border border-gray-200 rounded-xl p-1 gap-1">
        {(["today", "weekly"] as DashboardReminderPeriod[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => {
              setPeriod(p);
              setPage(1);
            }}
            className="flex-1"
          >
            <View
              className={`py-2 rounded-lg items-center ${
                period === p ? "bg-primary" : ""
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  period === p ? "text-white" : "text-textSecondary"
                }`}
              >
                {p === "today" ? "Today" : "This week"}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {buildingId == null ? (
        <View className="flex-1 items-center justify-center gap-2 px-6">
          <AppIcon name="business-outline" size={36} color="#CBD5E1" />
          <Text className="text-sm text-slate-400 text-center">
            Select a building to see reminders.
          </Text>
        </View>
      ) : showLoading ? (
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : isError && !reminders ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <AppIcon name="alert-circle-outline" size={36} color="#F87171" />
          <Text className="text-sm text-slate-500 text-center">
            Couldn&apos;t load reminders for{" "}
            {period === "today" ? "today" : "this week"}.
          </Text>
          <Pressable
            onPress={handleRefresh}
            className="rounded-xl bg-primary/10 px-4 py-2"
          >
            <Text className="text-sm font-semibold text-primary">Try again</Text>
          </Pressable>
        </View>
      ) : total === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <AppIcon name="alarm-outline" size={36} color="#CBD5E1" />
          <Text className="text-sm text-slate-400">
            {period === "today" ? "Nothing due today" : "Nothing due this week"}
          </Text>
          {parcelsError ? (
            <Text className="text-[11px] text-slate-400 px-6 text-center">
              Parcel reminders could not be loaded.
            </Text>
          ) : null}
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={pageItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || parcelsRefetching || parcelsFetching}
              onRefresh={handleRefresh}
            />
          }
          ListHeaderComponent={
            <View className="mb-3">
              <Text className="text-[11px] text-slate-400 mb-1">
                {fromDate === toDate ? fromDate : `${fromDate} – ${toDate}`}
              </Text>
              <Text className="text-[11px] text-slate-500">
                Tasks, bookings, trade visits & parcels · Showing{" "}
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}{" "}
                of {total}
              </Text>
            </View>
          }
          renderItem={({ item }) => <ReminderRow item={item} />}
          ListFooterComponent={
            <ListPager
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          }
        />
      )}
    </View>
  );
}

function ReminderRow({ item }: { item: FlatReminderItem }) {
  const meta = KIND_META[item.kind];

  if (item.kind === "task") {
    const task = item.data;
    const priorityKey =
      typeof task.priority === "string" ? task.priority.toUpperCase() : "";
    const priority = priorityKey ? PRIORITY_STYLE[priorityKey] : null;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(private)/task-management",
            params: { taskId: String(task.id) },
          })
        }
        className="bg-white rounded-xl border border-blue-100 p-3 flex-row items-center gap-3 mb-2"
      >
        <AppIcon name={meta.icon as any} size={18} color={meta.color} />
        <View className="flex-1 min-w-0">
          <Text className="text-[10px] font-semibold text-slate-400 uppercase">
            {meta.label}
          </Text>
          <Text
            className="text-sm font-medium text-textPrimary"
            numberOfLines={2}
          >
            {task.title || "Task"}
          </Text>
          <Text className="text-[11px] text-blue-600 mt-0.5" numberOfLines={2}>
            {[
              task.taskNumber,
              task.statusName,
              task.deadline ? `Due ${formatDateTime(task.deadline)}` : null,
              task.assignedToName,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        {priority ? (
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
        ) : null}
      </Pressable>
    );
  }

  if (item.kind === "booking") {
    const booking = item.data;
    const start = formatDateTime(booking.startDate);
    const end = booking.endDate ? formatDateTime(booking.endDate) : null;
    const title =
      booking.amenityName ||
      booking.description ||
      booking.title ||
      `Booking #${booking.id}`;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(private)/booking-management",
          })
        }
        className="bg-white rounded-xl border border-blue-100 p-3 flex-row items-center gap-3 mb-2"
      >
        <AppIcon name={meta.icon as any} size={18} color={meta.color} />
        <View className="flex-1 min-w-0">
          <Text className="text-[10px] font-semibold text-slate-400 uppercase">
            {meta.label}
          </Text>
          <Text
            className="text-sm font-medium text-textPrimary"
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text className="text-[11px] text-blue-600 mt-0.5" numberOfLines={2}>
            {[
              booking.towerName ? `Tower ${booking.towerName}` : null,
              booking.residentUnit ? `Unit ${booking.residentUnit}` : null,
              booking.residentName,
              end ? `${start} – ${end}` : start,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <StatusBadge status={booking.status} />
      </Pressable>
    );
  }

  if (item.kind === "trade") {
    const trade = item.data;
    const status = trade.status ?? trade.lifecycleStatus;

    return (
      <Pressable
        onPress={() => router.push("/(private)/trade-management")}
        className="bg-white rounded-xl border border-blue-100 p-3 flex-row items-center gap-3 mb-2"
      >
        <AppIcon name={meta.icon as any} size={18} color={meta.color} />
        <View className="flex-1 min-w-0">
          <Text className="text-[10px] font-semibold text-slate-400 uppercase">
            {meta.label}
          </Text>
          <Text
            className="text-sm font-medium text-textPrimary"
            numberOfLines={2}
          >
            {trade.tradeName || `Visit #${trade.id}`}
          </Text>
          <Text className="text-[11px] text-blue-600 mt-0.5" numberOfLines={2}>
            {[
              trade.company,
              formatDateTime(trade.scheduledAppointmentAt),
              trade.residentUnit ? `Unit ${trade.residentUnit}` : null,
              trade.location,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <StatusBadge status={status} />
      </Pressable>
    );
  }

  if (item.kind === "parcel") {
    const parcel = item.data;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(private)/parcel-management",
          })
        }
        className="bg-white rounded-xl border border-blue-100 p-3 flex-row items-center gap-3 mb-2"
      >
        <AppIcon name={meta.icon as any} size={18} color={meta.color} />
        <View className="flex-1 min-w-0">
          <Text className="text-[10px] font-semibold text-slate-400 uppercase">
            {meta.label}
          </Text>
          <Text
            className="text-sm font-medium text-textPrimary"
            numberOfLines={2}
          >
            {parcel.trackingId || `Parcel #${parcel.id}`}
          </Text>
          <Text className="text-[11px] text-blue-600 mt-0.5" numberOfLines={2}>
            {[
              parcel.residentName,
              parcel.unit ? `Unit ${parcel.unit}` : null,
              parcel.courier,
              parcel.location,
              parcel.receivedTime
                ? formatDateTime(parcel.receivedTime)
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <StatusBadge status={parcel.status} />
      </Pressable>
    );
  }

  const pm = item.data;
  return (
    <Pressable
      onPress={() => router.push("/(private)/preventative-maintenance")}
      className="bg-white rounded-xl border border-blue-100 p-3 flex-row items-center gap-3 mb-2"
    >
      <AppIcon name={meta.icon as any} size={18} color={meta.color} />
      <View className="flex-1 min-w-0">
        <Text className="text-[10px] font-semibold text-slate-400 uppercase">
          {meta.label}
        </Text>
        <Text
          className="text-sm font-medium text-textPrimary"
          numberOfLines={2}
        >
          {pm.maintenanceItem || `Item #${pm.id}`}
        </Text>
        <Text className="text-[11px] text-blue-600 mt-0.5" numberOfLines={2}>
          {[
            pm.reminderMonth ? `Scheduled for ${pm.reminderMonth}` : null,
            pm.frequency,
            pm.trade,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      <StatusBadge status={pm.statusForReminderMonth} />
    </Pressable>
  );
}
