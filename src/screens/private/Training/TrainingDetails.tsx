import { apiService } from "@/src/api/client";
import {
  useCompleteEmployeeTraining,
  useDeleteEmployeeTraining,
  useGetTrainingById,
  useUpdateTraining,
} from "@/src/api/training.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { getMimeType } from "@/src/helper/getMimeType";
import { TrainingEmployeeSummary } from "@/src/types/training.types";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function TrainingDetails() {
  const { id } = useLocalSearchParams();
  const trainingId = Number(id);
  const { data, isLoading, refetch } = useGetTrainingById(trainingId);
  const item = data?.data;

  const [editVisible, setEditVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [completeTarget, setCompleteTarget] =
    useState<TrainingEmployeeSummary | null>(null);
  const [removeTarget, setRemoveTarget] =
    useState<TrainingEmployeeSummary | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { mutate: updateMutate, isPending: updating } =
    useUpdateTraining(trainingId);
  const { mutate: completeMutate, isPending: completing } =
    useCompleteEmployeeTraining();
  const { mutate: removeMutate, isPending: removing } =
    useDeleteEmployeeTraining();

  useEffect(() => {
    if (item) {
      setTitle(item.title ?? "");
      setDescription(item.description ?? "");
    }
  }, [item]);

  const handleDownload = async (emp: TrainingEmployeeSummary) => {
    const name = emp.copiedFilename || `training-${emp.id}.docx`;
    setDownloadingId(emp.id);
    try {
      const response = await apiService.get(
        `/trainings/employee/${emp.id}/file`,
        { responseType: "arraybuffer" },
      );
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
      Alert.alert("Error", "Failed to download training document.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) return <LoadingState message="Loading..." />;
  if (!item) return <EmptyState message="Training not found" />;

  return (
    <>
      <ScrollView className="flex-1">
        <PageHeader
          showBackButton
          icon="school"
          title="Training Details"
          subtitle={item.title}
        />
        <Card className="p-4 mb-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 pr-2">
              <Text className="text-xs text-textSecondary">Template</Text>
              <Text className="text-sm font-semibold mb-3">
                {item.templateTitle || "—"}
              </Text>
              <Text className="text-xs text-textSecondary">Description</Text>
              <Text className="text-sm font-semibold mb-3">
                {item.description || "—"}
              </Text>
              <Text className="text-xs text-textSecondary">Progress</Text>
              <Text className="text-sm font-semibold">
                {item.completedEmployees ?? 0} of {item.totalEmployees ?? 0}{" "}
                completed
              </Text>
            </View>
            <Pressable
              onPress={() => setEditVisible(true)}
              className="px-3 py-1.5 rounded-lg bg-primary/10"
            >
              <Text className="text-xs font-semibold text-primary">Edit</Text>
            </Pressable>
          </View>
        </Card>

        <Text className="text-base font-bold text-textPrimary mb-2 px-1">
          Employees
        </Text>
        {(item.employees ?? []).length === 0 ? (
          <EmptyState message="No employees assigned" />
        ) : (
          (item.employees ?? []).map((emp) => (
            <View
              key={emp.id}
              className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 mb-2"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <AppIcon
                  name="person-circle-outline"
                  size={24}
                  color="#64748B"
                />
                <View className="flex-1">
                  <Text
                    className="text-sm font-medium text-textPrimary"
                    numberOfLines={1}
                  >
                    {emp.employeeName}
                  </Text>
                  <View
                    className={`self-start mt-1 px-2 py-0.5 rounded-full ${
                      emp.status === "COMPLETED"
                        ? "bg-green-100"
                        : "bg-amber-100"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-semibold ${
                        emp.status === "COMPLETED"
                          ? "text-green-700"
                          : "text-amber-700"
                      }`}
                    >
                      {emp.status === "COMPLETED" ? "Completed" : "In Progress"}
                    </Text>
                  </View>
                </View>
              </View>
              {downloadingId === emp.id ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <AnchoredPopupMenu
                  items={[
                    {
                      label: "Download",
                      icon: "download-outline",
                      onPress: () => handleDownload(emp),
                    },
                    ...(emp.status !== "COMPLETED"
                      ? [
                          {
                            label: "Mark complete",
                            icon: "checkmark-circle-outline" as const,
                            onPress: () => setCompleteTarget(emp),
                          },
                        ]
                      : []),
                    {
                      label: "Remove",
                      icon: "trash",
                      danger: true,
                      onPress: () => setRemoveTarget(emp),
                    },
                  ]}
                />
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        transparent
        visible={editVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setEditVisible(false)}
      >
        <Pressable
          onPress={() => setEditVisible(false)}
          className="flex-1 bg-black/50 items-center justify-center px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full rounded-2xl bg-white p-5 gap-3"
          >
            <Text className="text-lg font-bold text-textPrimary">
              Edit Training
            </Text>
            <AppInput label="Title" value={title} onChangeText={setTitle} />
            <AppInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <AppButton
                  variant="outline"
                  onPress={() => setEditVisible(false)}
                  disabled={updating}
                >
                  Cancel
                </AppButton>
              </View>
              <View className="flex-1">
                <AppButton
                  onPress={() => {
                    if (!title.trim()) return;
                    updateMutate(
                      {
                        title: title.trim(),
                        description: description.trim() || undefined,
                      },
                      {
                        onSuccess: () => {
                          setEditVisible(false);
                          refetch();
                        },
                      },
                    );
                  }}
                  loading={updating}
                  disabled={!title.trim()}
                >
                  Save
                </AppButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={!!completeTarget}
        title="Mark Complete"
        message={`Mark training complete for ${completeTarget?.employeeName}?`}
        confirmText="Complete"
        loading={completing}
        onCancel={() => setCompleteTarget(null)}
        onConfirm={() => {
          if (!completeTarget) return;
          completeMutate(
            { pathVars: { trainingEmployeeId: completeTarget.id } } as any,
            {
              onSuccess: () => {
                setCompleteTarget(null);
                refetch();
              },
              onError: () => setCompleteTarget(null),
            },
          );
        }}
      />

      <ConfirmModal
        visible={!!removeTarget}
        title="Remove Employee"
        message={`Remove ${removeTarget?.employeeName} from this training and delete their document?`}
        confirmText="Remove"
        destructive
        loading={removing}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          removeMutate(
            { pathVars: { trainingEmployeeId: removeTarget.id } } as any,
            {
              onSuccess: () => {
                setRemoveTarget(null);
                refetch();
              },
              onError: () => setRemoveTarget(null),
            },
          );
        }}
      />
    </>
  );
}
