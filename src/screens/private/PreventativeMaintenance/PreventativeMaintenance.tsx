import {
  useDeletePreventiveMaintenance,
  useGetPreventiveMaintenance,
  useGetPreventiveMaintenanceYears,
  useLoadPreventiveMaintenanceDefaults,
} from "@/src/api/preventativeMaintenance.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu, {
  MenuItem,
} from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import SelectField from "@/src/components/ui/SelectField";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  MONTH_CODES,
  MONTH_LABELS,
  parseScheduledMonths,
  PreventiveMaintenanceResponse,
  STATUS_COLORS,
  getMonthStatus,
} from "@/src/types/preventativeMaintenance.types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";

const DEFAULT_YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i);

export default function PreventativeMaintenance() {
  const { user, buildingId } = useAuth();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [deleteItem, setDeleteItem] =
    useState<PreventiveMaintenanceResponse | null>(null);

  const { data: yearsData } = useGetPreventiveMaintenanceYears();
  const yearsList = yearsData?.data?.length ? yearsData.data : DEFAULT_YEARS;

  const { data, isLoading, refetch, isRefetching } = useGetPreventiveMaintenance(
    buildingId ?? undefined,
    year,
    !!user?.userId,
  );

  const { mutate: deleteMutate, isPending: isDeleting } =
    useDeletePreventiveMaintenance(deleteItem?.id, buildingId ?? undefined);

  const { mutate: loadDefaultsMutate, isPending: isLoadingDefaults } =
    useLoadPreventiveMaintenanceDefaults(buildingId ?? undefined);

  const items = data?.data ?? [];

  const yearOptions = useMemo(
    () => yearsList.map((y) => ({ label: String(y), value: String(y) })),
    [yearsList],
  );

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutate(undefined, {
      onSuccess: () => {
        setDeleteItem(null);
        refetch();
      },
      onError: () => setDeleteItem(null),
    });
  };

  const handleLoadDefaults = () => {
    if (!buildingId) return;
    loadDefaultsMutate(
      { year },
      {
        onSuccess: () => refetch(),
      },
    );
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="construct"
        title="Preventative Maintenance"
        subtitle="Schedule and manage maintenance tasks by building."
      />

      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push("/(private)/preventative-maintenance/pm-add-edit")
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View className="flex-row items-end gap-3 px-1 mb-3">
        <View className="flex-1">
          <SelectField
            label="Year"
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            options={yearOptions}
            mode="dropdown"
          />
        </View>
        <AppButton
          variant="outline"
          size="md"
          fullWidth={false}
          loading={isLoadingDefaults}
          onPress={handleLoadDefaults}
        >
          Load Defaults
        </AppButton>
      </View>

      {isLoading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState message="No maintenance items for this year." />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const months = parseScheduledMonths(item.scheduledMonths);
            const items = [
              {
                label: "Edit",
                icon: "pencil",
                onPress: () =>
                  router.push({
                    pathname:
                      "/(private)/preventative-maintenance/pm-add-edit",
                    params: { pmId: item.id },
                  }),
              },
              {
                label: "Delete",
                icon: "trash",
                danger: true,
                onPress: () => setDeleteItem(item),
              },
            ] as MenuItem[];

            return (
              <Card className="px-4 py-3 mb-3">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-bold text-textPrimary">
                      {item.maintenanceItem}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {item.frequency || "No frequency set"}
                      {item.trade || item.tradeInvolved
                        ? ` · ${item.trade || item.tradeInvolved}`
                        : ""}
                    </Text>
                  </View>
                  <AnchoredPopupMenu items={items} />
                </View>

                <View className="flex-row flex-wrap gap-1 mt-1">
                  {MONTH_CODES.map((code, idx) => {
                    const scheduled = months.has(code);
                    const status = getMonthStatus(item, code);
                    const style = STATUS_COLORS[status];
                    return (
                      <View
                        key={code}
                        className={`w-7 h-7 rounded-md items-center justify-center ${
                          scheduled ? style.bg : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            scheduled ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {MONTH_LABELS[idx][0]}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {item.estCost ? (
                  <Text className="text-xs text-gray-500 mt-2">
                    Est. Cost: {item.estCost}
                  </Text>
                ) : null}
              </Card>
            );
          }}
        />
      )}

      <ConfirmModal
        visible={!!deleteItem}
        title="Delete Maintenance Item"
        message={`Are you sure you want to delete "${deleteItem?.maintenanceItem}"?`}
        confirmText="Delete"
        destructive
        loading={isDeleting}
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
