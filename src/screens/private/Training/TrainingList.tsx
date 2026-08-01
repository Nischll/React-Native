import { useGetStaffByBuilding } from "@/src/api/employee.api";
import {
  useCreateTraining,
  useDeleteTraining,
  useGetTrainingTemplates,
  useGetTrainings,
} from "@/src/api/training.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import SelectField from "@/src/components/ui/SelectField";
import { useAuth } from "@/src/providers/AuthProvider";
import { TrainingResponse } from "@/src/types/training.types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export default function TrainingList() {
  const { buildingId, user } = useAuth();
  const [addVisible, setAddVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [deleteItem, setDeleteItem] = useState<TrainingResponse | null>(null);

  const { data, isLoading, refetch, isRefetching } = useGetTrainings(
    { buildingId: buildingId ?? undefined },
    !!user?.userId,
  );
  const { data: templatesData } = useGetTrainingTemplates({ buildingId: buildingId ?? undefined }, addVisible);
  const { data: staffData } = useGetStaffByBuilding(addVisible ? (buildingId ?? null) : null);
  const { mutate: createMutate, isPending: creating } = useCreateTraining();
  const { mutate: deleteMutate, isPending: deleting } = useDeleteTraining(deleteItem?.id);

  const raw: any = data?.data;
  const items: TrainingResponse[] = Array.isArray(raw) ? raw : (raw?.data ?? []);

  const templatesRaw: any = templatesData?.data;
  const templateOptions = useMemo(
    () =>
      (Array.isArray(templatesRaw) ? templatesRaw : (templatesRaw?.data ?? [])).map((t: any) => ({
        label: t.title,
        value: String(t.id),
      })),
    [templatesRaw],
  );

  const employeeOptions = useMemo(
    () =>
      (staffData?.data ?? []).map((e) => ({
        label: `${e.firstName} ${e.lastName}`,
        value: String(e.id),
      })),
    [staffData],
  );

  const columns: MobileColumn<TrainingResponse>[] = [
    { key: "title", label: "Title", primary: true, searchable: true },
    { key: "templateTitle", label: "Template" },
    {
      key: "completedEmployees" as any,
      label: "Progress",
      render: (_, row) => `${row.completedEmployees ?? 0}/${row.totalEmployees ?? 0}`,
    },
  ];

  const handleCreate = () => {
    if (!title || !templateId || !buildingId) return;
    createMutate(
      {
        buildingId,
        templateId: Number(templateId),
        title,
        description: description || undefined,
        employeeIds: employeeIds.map(Number),
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setTemplateId("");
          setEmployeeIds([]);
          setAddVisible(false);
          refetch();
        },
      },
    );
  };

  return (
    <>
      <View className="flex-1">
        <PageHeader showBackButton icon="school" title="Training & Development" subtitle="Assign and track employee training." />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={() => setAddVisible(true)}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-1">
          <MobileDataList<TrainingResponse>
            data={items}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            keyExtractor={(item) => String(item.id)}
            emptyMessage="No trainings found"
            onRefresh={refetch}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[
                  {
                    label: "View",
                    icon: "eye",
                    onPress: () =>
                      router.push({ pathname: "/(private)/training-development/training-details", params: { id: String(row.id) } }),
                  },
                  { label: "Delete", icon: "trash", danger: true, onPress: () => setDeleteItem(row) },
                ]}
              />
            )}
          />
        </View>
      </View>

      <Modal transparent visible={addVisible} animationType="fade" statusBarTranslucent onRequestClose={() => setAddVisible(false)}>
        <Pressable onPress={() => setAddVisible(false)} className="flex-1 bg-black/50 items-center justify-center px-6">
          <Pressable onPress={(e) => e.stopPropagation()} className="w-full rounded-2xl bg-white p-5 gap-3">
            <Text className="text-lg font-bold text-textPrimary">Create Training</Text>
            <AppInput label="Title" value={title} onChangeText={setTitle} />
            <SelectField label="Template" placeholder="Select template" options={templateOptions} value={templateId} onChange={setTemplateId} />
            <AppInput label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
            <SelectField label="Employees" multi placeholder="Select employees" options={employeeOptions} value={employeeIds} onChange={setEmployeeIds} />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <AppButton variant="outline" onPress={() => setAddVisible(false)} disabled={creating}>
                  Cancel
                </AppButton>
              </View>
              <View className="flex-1">
                <AppButton onPress={handleCreate} loading={creating} disabled={!title || !templateId}>
                  Create
                </AppButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={!!deleteItem}
        title="Delete Training"
        message={`Are you sure you want to delete "${deleteItem?.title}"?`}
        confirmText="Delete"
        destructive
        loading={deleting}
        onCancel={() => setDeleteItem(null)}
        onConfirm={() =>
          deleteMutate(undefined, {
            onSuccess: () => {
              setDeleteItem(null);
              refetch();
            },
            onError: () => setDeleteItem(null),
          })
        }
      />
    </>
  );
}
