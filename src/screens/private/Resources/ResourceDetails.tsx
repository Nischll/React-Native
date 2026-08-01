import { apiService } from "@/src/api/client";
import { useGetResourceById } from "@/src/api/resources.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { getMimeType } from "@/src/helper/getMimeType";
import { ResourceAttachment } from "@/src/types/resource.types";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

export default function ResourceDetails() {
  const { id } = useLocalSearchParams();
  const { data, isLoading } = useGetResourceById(Number(id));
  const item = data?.data;
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (attachment: ResourceAttachment) => {
    const name = attachment.originalFileName ?? `attachment-${attachment.id}`;
    setDownloadingId(attachment.id);
    try {
      const response = await apiService.get(`/resources/files/${attachment.id}`, {
        responseType: "arraybuffer",
      });
      const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");
      const mime = getMimeType(name);

      if (Platform.OS === "android") {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          Alert.alert("Permission required", "Please allow access to save files.");
          return;
        }
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          name,
          mime,
        );
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        Alert.alert("Downloaded", `${name} saved successfully.`);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${encodeURIComponent(name)}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(fileUri, { mimeType: mime, dialogTitle: `Save ${name}` });
      }
    } catch (e) {
      Alert.alert("Error", "Failed to download attachment.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) return <LoadingState message="Loading..." />;
  if (!item) return <EmptyState message="Resource not found" />;

  return (
    <ScrollView className="flex-1">
      <PageHeader showBackButton icon="folder-open" title="Resource" subtitle={item.fileName} />
      <Card className="p-4 mb-3">
        <Text className="text-xs text-textSecondary">Type</Text>
        <Text className="text-sm font-semibold mb-3">{item.type}</Text>
        <Text className="text-xs text-textSecondary">Description</Text>
        <Text className="text-sm font-semibold mb-3">{item.description || "—"}</Text>
        <Text className="text-xs text-textSecondary">Created By</Text>
        <Text className="text-sm font-semibold">{item.createdByUserName || "—"}</Text>
      </Card>
      <Text className="text-base font-bold text-textPrimary mb-2 px-1">Attachments</Text>
      {(item.attachments ?? []).length === 0 ? (
        <EmptyState message="No attachments" />
      ) : (
        (item.attachments ?? []).map((att) => (
          <Pressable
            key={att.id}
            onPress={() => handleDownload(att)}
            disabled={downloadingId === att.id}
            className="flex-row items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 mb-2"
          >
            <AppIcon name="document-text-outline" size={22} color="#64748B" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-textPrimary" numberOfLines={1}>
                {att.originalFileName ?? `Attachment ${att.id}`}
              </Text>
              <Text className="text-xs text-textSecondary">{att.fileSizeDisplay ?? ""}</Text>
            </View>
            {downloadingId === att.id ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <AppIcon name="download-outline" size={18} color="#64748B" />
            )}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
