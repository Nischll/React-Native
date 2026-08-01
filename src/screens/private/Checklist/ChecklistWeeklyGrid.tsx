import {
  useGetWeeklyChecklist,
  useUpdateWeeklyChecklistCell,
} from "@/src/api/checklist.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import {
  formatApiDate,
  formatWeekEndingDisplay,
  getCompletedDateForDay,
  getNextWeekEnding,
  getPreviousWeekEnding,
  getTodayDayCodeForWeek,
  getWeekEndingFriday,
} from "@/src/helper/checklistDateUtils";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  CHECKLIST_CONFIGS,
  ChecklistPeriod,
  DAY_CODES,
  DAY_LABELS,
  DayCode,
  WeeklyChecklistRow,
} from "@/src/types/checklist.types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

interface Props {
  period: Extract<ChecklistPeriod, "daily" | "weekly">;
}

function isRowDayDone(row: WeeklyChecklistRow, day: DayCode): boolean {
  return !!row.days?.[day]?.isDone;
}

export default function ChecklistWeeklyGrid({ period }: Props) {
  const config = CHECKLIST_CONFIGS[period];
  const { user, buildingId } = useAuth();

  const [weekEnding, setWeekEnding] = useState(() =>
    formatApiDate(getWeekEndingFriday()),
  );
  const [pendingCell, setPendingCell] = useState<string | null>(null);

  const todayDay = useMemo(
    () => getTodayDayCodeForWeek(weekEnding),
    [weekEnding],
  );

  const { data, isLoading, refetch, isRefetching } = useGetWeeklyChecklist(
    config.basePath,
    { buildingId: buildingId ?? undefined, weekEnding, employeeId: user?.userId },
    !!user?.userId && buildingId != null,
  );

  const rows = data?.data?.rows ?? [];
  const cellMutation = useUpdateWeeklyChecklistCell(config.basePath);

  const handleCellPress = async (row: WeeklyChecklistRow, day: DayCode) => {
    if (!buildingId || cellMutation.isPending) return;

    const cellKey = `${row.templateId}-${day}`;
    const nextDone = !isRowDayDone(row, day);
    const dayCell = row.days?.[day];
    const completedDate = dayCell?.completedDate || getCompletedDateForDay(weekEnding, day);

    setPendingCell(cellKey);
    cellMutation.mutate(
      {
        buildingId,
        weekEnding,
        templateId: row.templateId,
        completedDate,
        isDone: nextDone,
        employeeId: user?.userId,
      },
      {
        onSuccess: () => refetch(),
        onSettled: () => setPendingCell(null),
      },
    );
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="checkbox"
        title={config.title}
        subtitle="Track duties completed for each weekday."
      />

      <View className="flex-row items-center justify-between px-1 mb-3">
        <Pressable
          onPress={() => setWeekEnding(getPreviousWeekEnding(weekEnding))}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <AppIcon name="chevron-back" size={18} color="#374151" />
        </Pressable>

        <View className="items-center">
          <Text className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Week Ending
          </Text>
          <Text className="text-sm font-bold text-textPrimary">
            {formatWeekEndingDisplay(weekEnding)}
          </Text>
        </View>

        <Pressable
          onPress={() => setWeekEnding(getNextWeekEnding(weekEnding))}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <AppIcon name="chevron-forward" size={18} color="#374151" />
        </Pressable>
      </View>

      <Pressable
        className="flex-row items-center justify-center gap-1.5 mb-3 py-2 rounded-xl bg-primary/10"
        onPress={() =>
          router.push(`/(private)/${period}-checklist-template` as any)
        }
      >
        <AppIcon name="settings-outline" size={16} color="#2563eb" />
        <Text className="text-sm font-semibold text-primary">
          Manage Duties / Templates
        </Text>
      </Pressable>

      {isLoading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : rows.length === 0 ? (
        <EmptyState message="No checklist duties configured for this building." />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {rows.map((row) => (
            <Card key={row.templateId} className="px-4 py-3 mb-3">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-textPrimary">
                    {row.serialNumber ?? row.sortOrder}. {row.workTitle}
                  </Text>
                  {!!row.time && (
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {row.time}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row justify-between mt-1">
                {DAY_CODES.map((day) => {
                  const done = isRowDayDone(row, day);
                  const isToday = todayDay === day;
                  const cellKey = `${row.templateId}-${day}`;
                  const busy = pendingCell === cellKey;

                  return (
                    <Pressable
                      key={day}
                      disabled={cellMutation.isPending}
                      onPress={() => handleCellPress(row, day)}
                      className={`flex-1 mx-0.5 h-12 rounded-lg items-center justify-center ${
                        done
                          ? "bg-green-500"
                          : isToday
                            ? "bg-primary/10 border border-primary"
                            : "bg-gray-100"
                      } ${busy ? "opacity-50" : ""}`}
                    >
                      <Text
                        className={`text-[10px] font-semibold ${
                          done ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </Text>
                      {done && (
                        <AppIcon name="checkmark" size={14} color="#fff" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
