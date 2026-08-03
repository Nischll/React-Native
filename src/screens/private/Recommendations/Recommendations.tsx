import { useCreateRecommendation, useDeleteRecommendation, useGetRecommendations } from "@/src/api/recommendations.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { formatDateOnly } from "@/src/helper/formatDateTime";
import { useAuth } from "@/src/providers/AuthProvider";
import { RecommendationItem } from "@/src/types/recommendation.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export default function Recommendations() {
  const { buildingId, user } = useAuth();
  const [addVisible, setAddVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [deleteItem, setDeleteItem] = useState<RecommendationItem | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useGetRecommendations(
    { page, limit: PAGE_SIZE, buildingId: buildingId ?? undefined },
    !!user?.userId,
  );
  const { mutate: createMutate, isPending: creating } = useCreateRecommendation();
  const { mutate: deleteMutate, isPending: deleting } = useDeleteRecommendation(deleteItem?.id);

  const { items, total } = extractPaginatedList<RecommendationItem>(data, { page, limit: PAGE_SIZE });

  const columns: MobileColumn<RecommendationItem>[] = [
    { key: "title", label: "Title", primary: true, searchable: true },
    { key: "type", label: "Type" },
    { key: "location", label: "Location" },
    { key: "recommendationDate", label: "Date" },
  ];

  const resetForm = () => {
    setTitle("");
    setType("");
    setLocation("");
    setDescription("");
    setPurpose("");
  };

  const handleCreate = () => {
    if (!title || !buildingId) return;
    createMutate(
      {
        buildingId,
        recommendationDate: formatDateOnly(new Date()),
        title,
        type: type || undefined,
        location: location || undefined,
        description: description || undefined,
        purpose: purpose || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          setAddVisible(false);
          refetch();
        },
      },
    );
  };

  return (
    <>
      <View className="flex-1">
        <PageHeader showBackButton icon="bulb" title="Recommendations" subtitle="Team recommendations feed." />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={() => setAddVisible(true)}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-1">
          <MobileDataList<RecommendationItem>
            data={items}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            backendMode
            pagination={{
              page,
              pageSize: PAGE_SIZE,
              total,
              hasMore: page * PAGE_SIZE < total,
              onPageChange: setPage,
            }}
            keyExtractor={(item) => String(item.id)}
            emptyMessage="No recommendations found"
            onRefresh={refetch}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[{ label: "Delete", icon: "trash", danger: true, onPress: () => setDeleteItem(row) }]}
              />
            )}
          />
        </View>
      </View>

      <Modal transparent visible={addVisible} animationType="fade" statusBarTranslucent onRequestClose={() => setAddVisible(false)}>
        <Pressable onPress={() => setAddVisible(false)} className="flex-1 bg-black/50 items-center justify-center px-6">
          <Pressable onPress={(e) => e.stopPropagation()} className="w-full rounded-2xl bg-white p-5 gap-3">
            <Text className="text-lg font-bold text-textPrimary">Add Recommendation</Text>
            <AppInput label="Title" value={title} onChangeText={setTitle} />
            <AppInput label="Type" value={type} onChangeText={setType} placeholder="e.g. Safety, Maintenance" />
            <AppInput label="Location" value={location} onChangeText={setLocation} />
            <AppInput label="Purpose" value={purpose} onChangeText={setPurpose} />
            <AppInput label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <AppButton variant="outline" onPress={() => setAddVisible(false)} disabled={creating}>
                  Cancel
                </AppButton>
              </View>
              <View className="flex-1">
                <AppButton onPress={handleCreate} loading={creating} disabled={!title}>
                  Add
                </AppButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={!!deleteItem}
        title="Delete Recommendation"
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
