import {
  useDeleteTrainingTemplate,
  useGetTrainingTemplates,
  useUploadTrainingTemplate,
} from "@/src/api/training.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import { useAuth } from "@/src/providers/AuthProvider";
import { TrainingTemplate } from "@/src/types/training.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export default function TrainingTemplates() {
  const { buildingId, user } = useAuth();
  const [addVisible, setAddVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [deleteItem, setDeleteItem] = useState<TrainingTemplate | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useGetTrainingTemplates(
    { page, limit: PAGE_SIZE, buildingId: buildingId ?? undefined },
    !!user?.userId,
  );
  const { mutate: uploadMutate, isPending: uploading } = useUploadTrainingTemplate();
  const { mutate: deleteMutate, isPending: deleting } = useDeleteTrainingTemplate(deleteItem?.id);

  const { items, total } = extractPaginatedList<TrainingTemplate>(data, { page, limit: PAGE_SIZE });

  const columns: MobileColumn<TrainingTemplate>[] = [
    { key: "title", label: "Title", primary: true, searchable: true },
    { key: "originalFilename", label: "File" },
    { key: "uploadedByName", label: "Uploaded By" },
  ];

  const handleUpload = () => {
    if (!title || !file || !buildingId) return;
    const formData = new FormData();
    formData.append("buildingId", String(buildingId));
    formData.append("title", title);
    formData.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as any);
    uploadMutate(formData, {
      onSuccess: () => {
        setTitle("");
        setFile(null);
        setAddVisible(false);
        refetch();
      },
    });
  };

  return (
    <>
      <View className="flex-1">
        <PageHeader showBackButton icon="document" title="Training Templates" subtitle="Reusable training documents." />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={() => setAddVisible(true)}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-1">
          <MobileDataList<TrainingTemplate>
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
            emptyMessage="No templates found"
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
            <Text className="text-lg font-bold text-textPrimary">Upload Template</Text>
            <AppInput label="Title" value={title} onChangeText={setTitle} />
            <FilePicker label="Document" accept="all" value={file} onChange={setFile} />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <AppButton variant="outline" onPress={() => setAddVisible(false)} disabled={uploading}>
                  Cancel
                </AppButton>
              </View>
              <View className="flex-1">
                <AppButton onPress={handleUpload} loading={uploading} disabled={!title || !file}>
                  Upload
                </AppButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={!!deleteItem}
        title="Delete Template"
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
