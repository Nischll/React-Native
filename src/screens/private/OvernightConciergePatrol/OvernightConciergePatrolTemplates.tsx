import {
  useAddChecklistTemplate,
  useDeleteChecklistTemplate,
  useGetChecklistTemplates,
  useLoadChecklistTemplateDefaults,
  useUpdateChecklistTemplate,
} from "@/src/api/checklist.api";
import FormSheetModal from "@/src/components/domain/FormSheetModal";
import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import ListPager from "@/src/components/layout/ListPager";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { ChecklistTemplateResponse } from "@/src/types/checklist.types";
import { OCP_BASE_PATH } from "@/src/types/overnightConciergePatrol.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

const BASE_PATH = OCP_BASE_PATH;

export default function OvernightConciergePatrolTemplates() {
  const { buildingId } = useAuth();

  const [page, setPage] = useState(1);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<ChecklistTemplateResponse | null>(
    null,
  );
  const [workTitle, setWorkTitle] = useState("");
  const [time, setTime] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<ChecklistTemplateResponse | null>(null);

  useEffect(() => {
    setPage(1);
  }, [buildingId]);

  const { data, isLoading, refetch, isRefetching } = useGetChecklistTemplates(
    BASE_PATH,
    buildingId ?? undefined,
    true,
    page,
    PAGE_SIZE,
  );

  const { items: templates, total } =
    extractPaginatedList<ChecklistTemplateResponse>(data, {
      page,
      limit: PAGE_SIZE,
    });

  const sortedTemplates = useMemo(
    () =>
      [...templates].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [templates],
  );

  const { mutate: addMutate, isPending: isAdding } =
    useAddChecklistTemplate(BASE_PATH);
  const { mutate: updateMutate, isPending: isUpdating } =
    useUpdateChecklistTemplate(BASE_PATH);
  const { mutate: deleteMutate, isPending: isDeleting } =
    useDeleteChecklistTemplate(BASE_PATH);
  const { mutate: loadDefaultsMutate, isPending: isLoadingDefaults } =
    useLoadChecklistTemplateDefaults(BASE_PATH, buildingId ?? undefined);

  const resetForm = () => {
    setWorkTitle("");
    setTime("");
    setSortOrder("");
    setEditing(null);
    setFormVisible(false);
  };

  const openAdd = () => {
    const nextSort =
      sortedTemplates.length > 0
        ? Math.max(...sortedTemplates.map((t) => t.sortOrder ?? 0), total) + 1
        : total + 1;
    setEditing(null);
    setWorkTitle("");
    setTime("");
    setSortOrder(String(nextSort));
    setFormVisible(true);
  };

  const openEdit = (item: ChecklistTemplateResponse) => {
    setEditing(item);
    setWorkTitle(item.workTitle ?? "");
    setTime(item.time ?? "");
    setSortOrder(item.sortOrder != null ? String(item.sortOrder) : "");
    setFormVisible(true);
  };

  const parsedSortOrder = Number.parseInt(sortOrder, 10);

  const handleSave = () => {
    if (!buildingId || !workTitle.trim()) return;
    const body = {
      buildingId,
      workTitle: workTitle.trim(),
      time: time.trim(),
      sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0,
    };

    if (editing) {
      updateMutate(
        { ...body, pathVars: { id: editing.id } },
        {
          onSuccess: () => {
            resetForm();
            refetch();
          },
        },
      );
      return;
    }

    addMutate(body, {
      onSuccess: () => {
        resetForm();
        refetch();
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          refetch();
        },
        onError: () => setDeleteTarget(null),
      },
    );
  };

  const handleLoadDefaults = () => {
    if (!buildingId) return;
    loadDefaultsMutate(
      { buildingId },
      {
        onSuccess: () => {
          setPage(1);
          refetch();
        },
      },
    );
  };

  const formBusy = isAdding || isUpdating;

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="list"
        title="Overnight Concierge Patrol Template"
        subtitle="Manage scan-point duties for overnight patrol."
      />

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <AppButton
            variant="outline"
            size="md"
            loading={isLoadingDefaults}
            onPress={handleLoadDefaults}
          >
            Load Defaults
          </AppButton>
        </View>
        <View className="flex-1">
          <AppButton size="md" onPress={openAdd}>
            Add Duty
          </AppButton>
        </View>
      </View>

      {isLoading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : sortedTemplates.length === 0 ? (
        <EmptyState message="No templates yet. Load defaults or add a duty." />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <View className="flex-row px-1 mb-1">
            <Text className="w-10 text-[10px] font-semibold uppercase text-slate-400">
              S.N
            </Text>
            <Text className="flex-1 text-[10px] font-semibold uppercase text-slate-400">
              Duties
            </Text>
            <Text className="w-20 text-[10px] font-semibold uppercase text-slate-400">
              Time
            </Text>
            <Text className="w-12 text-[10px] font-semibold uppercase text-slate-400">
              Order
            </Text>
            <View className="w-16" />
          </View>
          {sortedTemplates.map((item, index) => (
            <Card
              key={item.id}
              className="px-3 py-3 mb-3 flex-row items-center"
            >
              <Text className="w-10 text-sm font-bold text-textPrimary">
                {(page - 1) * PAGE_SIZE + index + 1}
              </Text>
              <Text
                className="flex-1 pr-2 text-sm font-semibold text-textPrimary"
                numberOfLines={2}
              >
                {item.workTitle}
              </Text>
              <Text className="w-20 text-xs text-gray-500" numberOfLines={1}>
                {item.time || "—"}
              </Text>
              <Text className="w-12 text-xs text-gray-500">
                {item.sortOrder ?? "—"}
              </Text>
              <View className="w-16 flex-row justify-end gap-1">
                <Pressable
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  onPress={() => openEdit(item)}
                >
                  <AppIcon name="create-outline" size={15} color="#334155" />
                </Pressable>
                <Pressable
                  className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
                  onPress={() => setDeleteTarget(item)}
                >
                  <AppIcon name="trash" size={14} color="#ef4444" />
                </Pressable>
              </View>
            </Card>
          ))}
          <ListPager
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </ScrollView>
      )}

      <FormSheetModal
        visible={formVisible}
        title={editing ? "Edit duty" : "Add duty"}
        submitLabel={editing ? "Save" : "Add"}
        loading={formBusy}
        submitDisabled={!workTitle.trim()}
        onClose={resetForm}
        onSubmit={handleSave}
      >
        <AppInput
          label="Duties / work title"
          value={workTitle}
          onChangeText={setWorkTitle}
          placeholder="e.g. Lobby scan point"
        />
        <View className="mt-3">
          <AppInput
            label="Time"
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 11:00 PM"
          />
        </View>
        <View className="mt-3">
          <AppInput
            label="Sort order"
            value={sortOrder}
            onChangeText={setSortOrder}
            keyboardType="number-pad"
            placeholder="1"
          />
        </View>
      </FormSheetModal>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Duty"
        message={`Are you sure you want to delete "${deleteTarget?.workTitle}"?`}
        confirmText="Delete"
        destructive
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
