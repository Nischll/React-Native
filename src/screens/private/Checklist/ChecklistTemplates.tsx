import {
  useAddChecklistTemplate,
  useDeleteChecklistTemplate,
  useGetChecklistTemplates,
  useLoadChecklistTemplateDefaults,
} from "@/src/api/checklist.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  CHECKLIST_CONFIGS,
  ChecklistPeriod,
  ChecklistTemplateResponse,
} from "@/src/types/checklist.types";
import { useMemo, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface Props {
  period: ChecklistPeriod;
}

export default function ChecklistTemplates({ period }: Props) {
  const config = CHECKLIST_CONFIGS[period];
  const { buildingId } = useAuth();

  const [addVisible, setAddVisible] = useState(false);
  const [workTitle, setWorkTitle] = useState("");
  const [time, setTime] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<ChecklistTemplateResponse | null>(null);

  const { data, isLoading, refetch, isRefetching } = useGetChecklistTemplates(
    config.basePath,
    buildingId ?? undefined,
  );

  const templates = useMemo(
    () =>
      [...(data?.data ?? [])].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
    [data],
  );

  const { mutate: addMutate, isPending: isAdding } =
    useAddChecklistTemplate(config.basePath);
  const { mutate: deleteMutate, isPending: isDeleting } =
    useDeleteChecklistTemplate(config.basePath);
  const { mutate: loadDefaultsMutate, isPending: isLoadingDefaults } =
    useLoadChecklistTemplateDefaults(config.basePath, buildingId ?? undefined);

  const resetAddForm = () => {
    setWorkTitle("");
    setTime("");
    setAddVisible(false);
  };

  const handleAdd = () => {
    if (!buildingId || !workTitle.trim()) return;

    const nextSortOrder =
      templates.length > 0
        ? Math.max(...templates.map((t) => t.sortOrder ?? 0)) + 1
        : 1;

    addMutate(
      {
        buildingId,
        workTitle: workTitle.trim(),
        time: time.trim(),
        sortOrder: nextSortOrder,
      },
      {
        onSuccess: () => {
          resetAddForm();
          refetch();
        },
      },
    );
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
    loadDefaultsMutate({ buildingId }, { onSuccess: () => refetch() });
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="list"
        title={config.templateTitle}
        subtitle="Manage the duties that appear on the checklist."
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
          <AppButton size="md" onPress={() => setAddVisible(true)}>
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
      ) : templates.length === 0 ? (
        <EmptyState message="No templates yet. Load defaults or add a duty." />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {templates.map((item, index) => (
            <Card
              key={item.id}
              className="px-4 py-3 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-textPrimary">
                  {index + 1}. {item.workTitle}
                </Text>
                {!!item.time && (
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {item.time}
                  </Text>
                )}
              </View>
              <Pressable
                className="w-9 h-9 rounded-full bg-red-50 items-center justify-center"
                onPress={() => setDeleteTarget(item)}
              >
                <AppIcon name="trash" size={16} color="#ef4444" />
              </Pressable>
            </Card>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={addVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Pressable
            className="flex-1 bg-black/40 justify-end"
            onPress={resetAddForm}
          >
            <Pressable
              className="bg-white rounded-t-3xl p-5"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="text-lg font-bold mb-4">Add Duty</Text>

              <AppInput
                label="Duty / Work Title"
                value={workTitle}
                onChangeText={setWorkTitle}
                placeholder="e.g. Inspect lobby entrance"
              />

              <View className="mt-3">
                <AppInput
                  label="Time"
                  value={time}
                  onChangeText={setTime}
                  placeholder="e.g. 9:00 AM"
                />
              </View>

              <View className="flex-row gap-3 mt-6">
                <View className="flex-1">
                  <AppButton variant="outline" onPress={resetAddForm}>
                    Cancel
                  </AppButton>
                </View>
                <View className="flex-1">
                  <AppButton loading={isAdding} onPress={handleAdd}>
                    Add
                  </AppButton>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </TouchableWithoutFeedback>
      </Modal>

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
