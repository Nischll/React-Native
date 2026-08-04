import { apiService } from "@/src/api/client";
import AppIcon from "@/src/components/ui/AppIcon";
import { getMimeType } from "@/src/helper/getMimeType";
import { getUTI } from "@/src/helper/getUTI";
import { attachmentTitlePathSegment } from "@/src/helper/multipartFile";
import { TaskResponseData } from "@/src/types/task-management.types";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

interface Props {
  attachments: TaskResponseData["attachmentResponsePojoList"];
  /** Fallback when an attachment row is missing taskId */
  taskId?: number;
}

interface AttachmentItem {
  id: number;
  taskId: number;
  title: string;
}

/** Local FS-safe name (do not URI-encode the whole filename). */
function localSafeFileName(title: string) {
  const base = title.trim() || "attachment";
  return base.replace(/[/\\?%*:|"<>]/g, "_");
}

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function isImage(filename: string) {
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(
    getFileExtension(filename),
  );
}

function getFileIcon(filename: string) {
  const ext = getFileExtension(filename);
  if (["pdf"].includes(ext)) return "document-text-outline";
  if (["doc", "docx"].includes(ext)) return "document-outline";
  if (["xls", "xlsx", "csv"].includes(ext)) return "grid-outline";
  if (["zip", "rar", "7z"].includes(ext)) return "archive-outline";
  return "attach-outline";
}

// Add these helpers at the top alongside your other helpers

function getFileColor(filename: string) {
  const ext = getFileExtension(filename);
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return "img";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv"].includes(ext)) return "xls";
  if (["zip", "rar", "7z"].includes(ext)) return "zip";
  return "default";
}

const FILE_COLORS = {
  pdf: {
    thumb: "bg-[#FAECE7]",
    border: "border-[#F5C4B3]",
    badge: "bg-[#F5C4B3]",
    badgeText: "text-[#712B13]",
    icon: "#993C1D",
    action: "bg-[#FAECE7]",
  },
  img: {
    thumb: "bg-[#E6F1FB]",
    border: "border-[#B5D4F4]",
    badge: "bg-[#B5D4F4]",
    badgeText: "text-[#0C447C]",
    icon: "#185FA5",
    action: "bg-[#E6F1FB]",
  },
  doc: {
    thumb: "bg-[#E1F5EE]",
    border: "border-[#9FE1CB]",
    badge: "bg-[#9FE1CB]",
    badgeText: "text-[#085041]",
    icon: "#0F6E56",
    action: "bg-[#E1F5EE]",
  },
  xls: {
    thumb: "bg-[#EAF3DE]",
    border: "border-[#C0DD97]",
    badge: "bg-[#C0DD97]",
    badgeText: "text-[#27500A]",
    icon: "#3B6D11",
    action: "bg-[#EAF3DE]",
  },
  zip: {
    thumb: "bg-[#FAEEDA]",
    border: "border-[#FAC775]",
    badge: "bg-[#FAC775]",
    badgeText: "text-[#633806]",
    icon: "#854F0B",
    action: "bg-[#FAEEDA]",
  },
  default: {
    thumb: "bg-slate-50",
    border: "border-slate-200",
    badge: "bg-slate-100",
    badgeText: "text-slate-600",
    icon: "#94A3B8",
    action: "bg-slate-50",
  },
} as const;

export default function TaskAttachments({ attachments, taskId }: Props) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  if (!attachments || attachments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <AppIcon name="attach-outline" size={40} color="#CBD5E1" />
        <Text className="text-slate-400 text-sm mt-3">No attachments</Text>
      </View>
    );
  }

  const resolveTaskId = (attachment: AttachmentItem) =>
    attachment.taskId || taskId;

  const fetchBinary = async (attachment: AttachmentItem) => {
    const resolvedTaskId = resolveTaskId(attachment);
    if (!resolvedTaskId || !attachment.title?.trim()) {
      throw new Error("Missing task or file name for download.");
    }
    // Encode the filename segment once (RN does not auto-encode like browsers).
    // Decode first if the stored title is already percent-encoded (common from iOS uploads).
    const fileSegment = attachmentTitlePathSegment(attachment.title);
    const response = await apiService.get(
      `/attachment/${resolvedTaskId}/${fileSegment}`,
      {
        responseType: "arraybuffer",
        transformResponse: (data) => data,
        headers: {
          Accept: "*/*",
        },
        timeout: 60000,
      },
    );
    return response.data as ArrayBuffer;
  };

  const handleDownload = async (attachment: AttachmentItem) => {
    setLoadingId(attachment.id);
    try {
      const buffer = await fetchBinary(attachment);
      const base64 = Buffer.from(buffer).toString("base64");
      const saveName = localSafeFileName(attachment.title);

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

        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          saveName,
          getMimeType(attachment.title),
        );

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        Alert.alert("Downloaded", `${attachment.title} saved successfully.`);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${saveName}`;

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(fileUri, {
          mimeType: getMimeType(attachment.title),
          dialogTitle: `Save ${attachment.title}`,
          UTI: getUTI(attachment.title),
        });
      }
    } catch (e: any) {
      console.log("Download error:", e);
      if (Platform.OS === "android" && String(e).includes("isn't writable")) {
        Alert.alert(
          "Folder not supported",
          "Please choose a different folder (e.g. Documents or Pictures). The Downloads folder cannot be used directly.",
        );
      } else {
        const status = e?.response?.status;
        Alert.alert(
          "Error",
          status === 404
            ? "File not found on server. Try re-uploading the attachment."
            : "Failed to download file.",
        );
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleImage = async (attachment: AttachmentItem) => {
    setLoadingId(attachment.id);
    try {
      const buffer = await fetchBinary(attachment);
      const base64 = Buffer.from(buffer).toString("base64");

      const ext = getFileExtension(attachment.title);
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      const mime = mimeMap[ext] ?? "image/jpeg";
      setPreviewTitle(attachment.title);
      setPreviewUri(`data:${mime};base64,${base64}`);
    } catch (e) {
      console.log("Image error:", e);
      Alert.alert("Error", "Failed to load image preview.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleTap = (attachment: AttachmentItem) => {
    if (isImage(attachment.title)) {
      handleImage(attachment);
    } else {
      handleDownload(attachment);
    }
  };

  return (
    <>
      {/* ── Image Preview Modal ── */}
      <Modal
        visible={!!previewUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-black/90">
          {/* Close + title row */}
          <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
            <Text className="text-white text-xs flex-1 mr-3" numberOfLines={1}>
              {previewTitle}
            </Text>
            <Pressable
              onPress={() => setPreviewUri(null)}
              className="bg-white/20 rounded-full p-2"
            >
              <AppIcon name="close-outline" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Image centered in remaining space */}
          <View className="flex-1 justify-center items-center px-4">
            {previewUri && (
              <Image
                source={{ uri: previewUri }}
                style={{ width: "100%", height: 400 }}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── Attachment Grid ── */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-3">
          {attachments.map((attachment) => {
            const isImg = isImage(attachment.title);
            const isLoading = loadingId === attachment.id;
            const colorKey = getFileColor(attachment.title);
            const colors = FILE_COLORS[colorKey];
            const ext = getFileExtension(attachment.title).toUpperCase();

            return (
              <Pressable
                key={attachment.id}
                onPress={() => handleTap(attachment)}
                disabled={isLoading}
                className={`w-[48%] bg-white border rounded-2xl overflow-hidden active:opacity-70 ${colors.border}`}
              >
                {/* Thumbnail */}
                <View
                  className={`h-28 items-center justify-center gap-2 ${colors.thumb}`}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.icon} />
                  ) : (
                    <>
                      <AppIcon
                        name={
                          isImg
                            ? "image-outline"
                            : (getFileIcon(attachment.title) as any)
                        }
                        size={36}
                        color={colors.icon}
                      />
                      <View
                        className={`px-2 py-0.5 rounded-full ${colors.badge}`}
                      >
                        <Text
                          className={`text-[10px] font-semibold ${colors.badgeText}`}
                        >
                          {ext}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Footer */}
                <View className="p-3 flex-row items-center justify-between bg-white">
                  <Text
                    className="text-xs text-slate-700 font-medium flex-1 mr-2"
                    numberOfLines={2}
                  >
                    {attachment.title}
                  </Text>
                  <View
                    className={`w-7 h-7 rounded-lg items-center justify-center ${colors.action}`}
                  >
                    <AppIcon
                      name={isImg ? "eye-outline" : "download-outline"}
                      size={14}
                      color={colors.icon}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}
