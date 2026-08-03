import {
  useDeletePreventiveMaintenance,
  useGetPreventiveMaintenance,
  useGetPreventiveMaintenanceYears,
  useLoadPreventiveMaintenanceDefaults,
  useUpdatePreventiveMaintenance,
} from "@/src/api/preventativeMaintenance.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import ListPager from "@/src/components/layout/ListPager";
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
  PreventiveMaintenanceRequestPojo,
  PreventiveMaintenanceResponse,
  PreventiveMaintenanceStatus,
  serializeScheduledMonths,
  STATUS_COLORS,
  getMonthStatus,
} from "@/src/types/preventativeMaintenance.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import {
  PMMonthActionSheet,
  PMNoteModal,
  PMStatusChangeModal,
} from "./PMMonthModals";

const DEFAULT_YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i);

export default function PreventativeMaintenance() {
  const { user, buildingId } = useAuth();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [deleteItem, setDeleteItem] =
    useState<PreventiveMaintenanceResponse | null>(null);

  const [monthAction, setMonthAction] = useState<{
    item: PreventiveMaintenanceResponse;
    monthCode: string;
  } | null>(null);
  const [statusChange, setStatusChange] = useState<{
    item: PreventiveMaintenanceResponse;
    monthCode: string;
    newStatus: PreventiveMaintenanceStatus;
  } | null>(null);
  const [noteDialog, setNoteDialog] = useState<{
    item: PreventiveMaintenanceResponse;
    monthCode: string;
  } | null>(null);

  const { data: yearsData } = useGetPreventiveMaintenanceYears();
  const yearsList = yearsData?.data?.length ? yearsData.data : DEFAULT_YEARS;

  useEffect(() => {
    setPage(1);
  }, [year, buildingId]);

  const { data, isLoading, refetch, isRefetching } = useGetPreventiveMaintenance(
    buildingId ?? undefined,
    year,
    !!user?.userId,
    page,
    PAGE_SIZE,
  );

  const { mutate: deleteMutate, isPending: isDeleting } =
    useDeletePreventiveMaintenance();

  const { mutate: updateMutate, isPending: isUpdating } =
    useUpdatePreventiveMaintenance(undefined, buildingId ?? undefined);

  const { mutate: loadDefaultsMutate, isPending: isLoadingDefaults } =
    useLoadPreventiveMaintenanceDefaults(buildingId ?? undefined);

  const { items, total } = extractPaginatedList<PreventiveMaintenanceResponse>(
    data,
    { page, limit: PAGE_SIZE },
  );

  const yearOptions = useMemo(
    () => yearsList.map((y) => ({ label: String(y), value: String(y) })),
    [yearsList],
  );

  const handleInlineStatusChange = (
    item: PreventiveMaintenanceResponse,
    monthCode: string,
    newStatus: PreventiveMaintenanceStatus | null,
    note?: string,
  ) => {
    if (!buildingId || !item.id) return;

    const months = parseScheduledMonths(item.scheduledMonths);
    const spm = { ...(item.statusPerMonth ?? {}) };
    const npm = { ...(item.notesPerMonth ?? {}) };

    if (newStatus === null) {
      months.delete(monthCode);
      delete spm[monthCode];
      delete npm[monthCode];
    } else {
      months.add(monthCode);
      spm[monthCode] = newStatus;
      if (note !== undefined) {
        if (note.trim()) npm[monthCode] = note.trim();
        else delete npm[monthCode];
      }
    }

    const payload: PreventiveMaintenanceRequestPojo & {
      pathVars: { id: number; buildingId: number };
    } = {
      id: item.id,
      buildingId,
      year: item.year ?? year,
      maintenanceItem: item.maintenanceItem ?? "",
      frequency: item.frequency,
      estCost: item.estCost,
      trade: item.trade ?? item.tradeInvolved,
      tradeInvolved: item.trade ?? item.tradeInvolved,
      status: item.status,
      statusPerMonth: Object.keys(spm).length > 0 ? spm : undefined,
      notesPerMonth: Object.keys(npm).length > 0 ? npm : undefined,
      notes: item.notes,
      scheduledMonths: serializeScheduledMonths(months),
      pathVars: { id: item.id, buildingId },
    };

    updateMutate(payload as any, {
      onSuccess: () => refetch(),
    });
  };

  const handleDelete = () => {
    if (!deleteItem?.id || !buildingId) return;
    deleteMutate(
      { id: deleteItem.id, buildingId },
      {
        onSuccess: () => {
          setDeleteItem(null);
          refetch();
        },
        onError: () => setDeleteItem(null),
      },
    );
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

  const openEdit = (item: PreventiveMaintenanceResponse) => {
    router.push({
      pathname: "/(private)/preventative-maintenance/pm-add-edit",
      params: {
        pmId: String(item.id),
        year: String(item.year ?? year),
      },
    });
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
            router.push({
              pathname: "/(private)/preventative-maintenance/pm-add-edit",
              params: { year: String(year) },
            })
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
            onChange={(v) => {
              setPage(1);
              setYear(Number(v));
            }}
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
          disabled={!buildingId}
        >
          Load Defaults
        </AppButton>
      </View>

      {items.length > 0 && (
        <View className="flex-row flex-wrap gap-x-3 gap-y-1 px-1 mb-2">
          {(
            ["SCHEDULED", "REQUESTED", "COMPLETED", "CANCELLED"] as const
          ).map((s) => (
            <View key={s} className="flex-row items-center gap-1">
              <View
                className={`w-4 h-4 rounded items-center justify-center ${STATUS_COLORS[s].bg}`}
              >
                <Text className="text-[8px] font-bold text-white">
                  {STATUS_COLORS[s].letter}
                </Text>
              </View>
              <Text className="text-[10px] text-gray-500">
                {STATUS_COLORS[s].label}
              </Text>
            </View>
          ))}
        </View>
      )}

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
          ListFooterComponent={
            total > 0 ? (
              <ListPager
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
              />
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 96 }}
          renderItem={({ item }) => {
            const months = parseScheduledMonths(item.scheduledMonths);
            const menuItems = [
              {
                label: "Edit",
                icon: "pencil",
                onPress: () => openEdit(item),
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
                  <AnchoredPopupMenu items={menuItems} />
                </View>

                <View className="flex-row flex-wrap gap-1 mt-1">
                  {MONTH_CODES.map((code, idx) => {
                    const scheduled = months.has(code);
                    const status = getMonthStatus(item, code);
                    const style = STATUS_COLORS[status];
                    const hasNote = !!item.notesPerMonth?.[code];
                    return (
                      <Pressable
                        key={code}
                        disabled={isUpdating}
                        onPress={() =>
                          setMonthAction({ item, monthCode: code })
                        }
                        className={`w-7 h-7 rounded-md items-center justify-center ${
                          scheduled ? style.bg : "bg-gray-100"
                        } ${hasNote ? "border border-white/40" : ""}`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            scheduled ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {scheduled ? style.letter : MONTH_LABELS[idx][0]}
                        </Text>
                      </Pressable>
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

      <PMMonthActionSheet
        visible={!!monthAction}
        item={monthAction?.item ?? null}
        monthCode={monthAction?.monthCode ?? null}
        isScheduled={
          !!monthAction &&
          parseScheduledMonths(monthAction.item.scheduledMonths).has(
            monthAction.monthCode,
          )
        }
        onClose={() => setMonthAction(null)}
        onSelectStatus={(status) => {
          if (!monthAction) return;
          setStatusChange({
            item: monthAction.item,
            monthCode: monthAction.monthCode,
            newStatus: status,
          });
          setMonthAction(null);
        }}
        onRemoveStatus={() => {
          if (!monthAction) return;
          handleInlineStatusChange(
            monthAction.item,
            monthAction.monthCode,
            null,
          );
          setMonthAction(null);
        }}
        onEditNote={() => {
          if (!monthAction) return;
          setNoteDialog({
            item: monthAction.item,
            monthCode: monthAction.monthCode,
          });
          setMonthAction(null);
        }}
        onEditDetails={() => {
          if (!monthAction) return;
          openEdit(monthAction.item);
          setMonthAction(null);
        }}
      />

      <PMStatusChangeModal
        visible={!!statusChange}
        item={statusChange?.item ?? null}
        monthCode={statusChange?.monthCode ?? null}
        newStatus={statusChange?.newStatus ?? null}
        loading={isUpdating}
        onClose={() => setStatusChange(null)}
        onSave={(note) => {
          if (!statusChange) return;
          handleInlineStatusChange(
            statusChange.item,
            statusChange.monthCode,
            statusChange.newStatus,
            note,
          );
          setStatusChange(null);
        }}
      />

      <PMNoteModal
        visible={!!noteDialog}
        item={noteDialog?.item ?? null}
        monthCode={noteDialog?.monthCode ?? null}
        loading={isUpdating}
        onClose={() => setNoteDialog(null)}
        onSave={(note) => {
          if (!noteDialog) return;
          handleInlineStatusChange(
            noteDialog.item,
            noteDialog.monthCode,
            getMonthStatus(noteDialog.item, noteDialog.monthCode),
            note,
          );
          setNoteDialog(null);
        }}
      />

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
