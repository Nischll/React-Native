import { apiService } from "@/src/api/client";
import {
  useCreateResidentForm,
  useDeleteResidentForm,
  useGetResidentForms,
  useUpdateResidentForm,
} from "@/src/api/residentForms.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import { getMimeType } from "@/src/helper/getMimeType";
import { useAuth } from "@/src/providers/AuthProvider";
import { ResidentForm } from "@/src/types/residentForm.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { Alert, Modal, Platform, Pressable, Text, View } from "react-native";

export default function ResidentForms() {
  const { buildingId, user } = useAuth();
  const [addVisible, setAddVisible] = useState(false);
  const [editItem, setEditItem] = useState<ResidentForm | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [deleteItem, setDeleteItem] = useState<ResidentForm | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useGetResidentForms(
    { page, limit: PAGE_SIZE, buildingId: buildingId ?? undefined },
    !!user?.userId,
  );
  const { mutate: createMutate, isPending: creating } = useCreateResidentForm();
  const { mutate: updateMutate, isPending: updating } = useUpdateResidentForm(
    editItem?.id,
  );
  const { mutate: deleteMutate, isPending: deleting } = useDeleteResidentForm(
    deleteItem?.id,
  );

  const { items, total } = extractPaginatedList<ResidentForm>(data, {
    page,
    limit: PAGE_SIZE,
  });

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title ?? "");
      setFile(null);
    }
  }, [editItem]);

  const columns: MobileColumn<ResidentForm>[] = [
    { key: "title", label: "Title", primary: true, searchable: true },
    { key: "fileName", label: "File" },
  ];

  const resetForm = () => {
    setTitle("");
    setFile(null);
    setAddVisible(false);
    setEditItem(null);
  };

  const handleCreate = () => {
    if (!title || !file) return;
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as any);
    createMutate(formData, {
      onSuccess: () => {
        resetForm();
        refetch();
      },
    });
  };

  const handleUpdate = () => {
    if (!editItem || !title.trim()) return;
    const formData = new FormData();
    formData.append("title", title.trim());
    if (file) {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as any);
    }
    updateMutate(formData, {
      onSuccess: () => {
        resetForm();
        refetch();
      },
    });
  };

  const handleDownload = async (row: ResidentForm) => {
    const name = row.fileName || `form-${row.id}`;
    try {
      const response = await apiService.get(`/resident-forms/${row.id}/file`, {
        responseType: "arraybuffer",
      });
      const base64 = Buffer.from(response.data as ArrayBuffer).toString(
        "base64",
      );
      const mime = getMimeType(name);

      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          Alert.alert(
            "Permission required",
            "Please allow access to save files.",
          );
          return;
        }
        const fileUri =
          await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            name,
            mime,
          );
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        Alert.alert("Downloaded", `${name} saved successfully.`);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${encodeURIComponent(name)}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(fileUri, {
          mimeType: mime,
          dialogTitle: `Save ${name}`,
        });
      }
    } catch {
      Alert.alert("Error", "Failed to download form file.");
    }
  };

  const modalVisible = addVisible || !!editItem;
  const saving = creating || updating;

  return (
    <>
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="document-text"
          title="Resident Forms"
          subtitle="Manage the resident form catalog."
        />
        <Pressable
          className="flex-row items-center justify-center gap-1.5 mb-3 py-2 rounded-xl bg-primary/10"
          onPress={() => router.push("/(private)/resident-form-forwards" as any)}
        >
          <AppIcon name="send-outline" size={16} color="#2563eb" />
          <Text className="text-sm font-semibold text-primary">
            Forward forms
          </Text>
        </Pressable>
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={() => setAddVisible(true)}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-1">
          <MobileDataList<ResidentForm>
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
            emptyMessage="No forms found"
            onRefresh={refetch}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[
                  {
                    label: "Download",
                    icon: "download-outline",
                    onPress: () => handleDownload(row),
                  },
                  {
                    label: "Edit",
                    icon: "create-outline",
                    onPress: () => setEditItem(row),
                  },
                  {
                    label: "Delete",
                    icon: "trash",
                    danger: true,
                    onPress: () => setDeleteItem(row),
                  },
                ]}
              />
            )}
          />
        </View>
      </View>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={resetForm}
      >
        <Pressable
          onPress={resetForm}
          className="flex-1 bg-black/50 items-center justify-center px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full rounded-2xl bg-white p-5 gap-3"
          >
            <Text className="text-lg font-bold text-textPrimary">
              {editItem ? "Edit Resident Form" : "Add Resident Form"}
            </Text>
            <AppInput
              label="Form Title"
              value={title}
              onChangeText={setTitle}
            />
            <FilePicker
              label={editItem ? "Replace File (optional)" : "Form File"}
              accept="all"
              value={file}
              onChange={setFile}
            />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <AppButton
                  variant="outline"
                  onPress={resetForm}
                  disabled={saving}
                >
                  Cancel
                </AppButton>
              </View>
              <View className="flex-1">
                <AppButton
                  onPress={editItem ? handleUpdate : handleCreate}
                  loading={saving}
                  disabled={!title.trim() || (!editItem && !file)}
                >
                  {editItem ? "Save" : "Add"}
                </AppButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={!!deleteItem}
        title="Delete Form"
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
