import {
  periodEndingKey,
  useGetPeriodChecklist,
  useUpdatePeriodChecklistCell,
} from "@/src/api/checklist.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import {
  formatApiDate,
  formatMonthEndingDisplay,
  formatYearEndingDisplay,
  getMonthEnding,
  getNextMonthEnding,
  getNextYearEnding,
  getPreviousMonthEnding,
  getPreviousYearEnding,
  getYearEnding,
} from "@/src/helper/checklistDateUtils";
import { useAuth } from "@/src/providers/AuthProvider";
import { CHECKLIST_CONFIGS, ChecklistPeriod } from "@/src/types/checklist.types";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

interface Props {
  period: Extract<ChecklistPeriod, "monthly" | "annual">;
}

interface RowShape {
  templateId: number;
  serialNumber?: number;
  sortOrder?: number;
  workTitle: string;
  time?: string;
  cell?: { isDone?: boolean; completedDate?: string };
}

export default function ChecklistPeriodGrid({ period }: Props) {
  const config = CHECKLIST_CONFIGS[period];
  const { user, buildingId } = useAuth();
  const isMonthly = period === "monthly";

  const [periodEnding, setPeriodEnding] = useState(() =>
    formatApiDate(isMonthly ? getMonthEnding() : getYearEnding()),
  );
  const [pendingRow, setPendingRow] = useState<number | null>(null);

  const { data, isLoading, refetch, isRefetching } = useGetPeriodChecklist(
    config.basePath,
    period,
    { buildingId: buildingId ?? undefined, periodEnding, employeeId: user?.userId },
    !!user?.userId && buildingId != null,
  );

  const key = periodEndingKey(period);
  const responseData = data?.data as Record<string, any> | undefined;
  const rows: RowShape[] = responseData?.rows ?? [];

  const cellMutation = useUpdatePeriodChecklistCell(config.basePath, period);

  const handleTogglePress = (row: RowShape) => {
    if (!buildingId || cellMutation.isPending) return;
    const nextDone = !row.cell?.isDone;

    setPendingRow(row.templateId);
    cellMutation.mutate(
      {
        buildingId,
        [key]: periodEnding,
        templateId: row.templateId,
        isDone: nextDone,
        employeeId: user?.userId,
      },
      {
        onSuccess: () => refetch(),
        onSettled: () => setPendingRow(null),
      },
    );
  };

  const label = isMonthly
    ? formatMonthEndingDisplay(periodEnding)
    : formatYearEndingDisplay(periodEnding);

  const goPrevious = () =>
    setPeriodEnding(
      isMonthly
        ? getPreviousMonthEnding(periodEnding)
        : getPreviousYearEnding(periodEnding),
    );

  const goNext = () =>
    setPeriodEnding(
      isMonthly
        ? getNextMonthEnding(periodEnding)
        : getNextYearEnding(periodEnding),
    );

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="checkbox"
        title={config.title}
        subtitle={`Track duties completed each ${isMonthly ? "month" : "year"}.`}
      />

      <View className="flex-row items-center justify-between px-1 mb-3">
        <Pressable
          onPress={goPrevious}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <AppIcon name="chevron-back" size={18} color="#374151" />
        </Pressable>

        <View className="items-center">
          <Text className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            {isMonthly ? "Month Ending" : "Year Ending"}
          </Text>
          <Text className="text-sm font-bold text-textPrimary">{label}</Text>
        </View>

        <Pressable
          onPress={goNext}
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
          {rows.map((row) => {
            const done = !!row.cell?.isDone;
            const busy = pendingRow === row.templateId;
            return (
              <Card
                key={row.templateId}
                className="px-4 py-3 mb-3 flex-row items-center justify-between"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-bold text-textPrimary">
                    {row.serialNumber ?? row.sortOrder}. {row.workTitle}
                  </Text>
                  {!!row.time && (
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {row.time}
                    </Text>
                  )}
                </View>

                <Pressable
                  disabled={cellMutation.isPending}
                  onPress={() => handleTogglePress(row)}
                  className={`w-11 h-11 rounded-full items-center justify-center ${
                    done ? "bg-green-500" : "bg-gray-100"
                  } ${busy ? "opacity-50" : ""}`}
                >
                  <AppIcon
                    name={done ? "checkmark" : "ellipse-outline"}
                    size={20}
                    color={done ? "#fff" : "#9ca3af"}
                  />
                </Pressable>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
