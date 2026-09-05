import { apiService } from "@/src/api/client";
import AppIcon from "@/src/components/ui/AppIcon";
import { getMimeType } from "@/src/helper/getMimeType";
import {
  TaskAiResourceResult,
  taskAiResourceFilePath,
  taskAiResourceLocationLabel,
} from "@/src/types/taskAi.types";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

async function downloadResource(result: TaskAiResourceResult) {
  const path = taskAiResourceFilePath(result);
  if (!path) throw new Error("No download path");
  const name =
    result.fileName?.trim() || `attachment-${result.attachmentId}`;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    const can = await Linking.canOpenURL(path);
    if (!can) throw new Error("Cannot open file URL");
    await Linking.openURL(path);
    return;
  }

  const response = await apiService.get(path, {
    responseType: "arraybuffer",
    skipGlobalLoading: true,
  } as { responseType: "arraybuffer"; skipGlobalLoading: boolean });
  const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");
  const mime = getMimeType(name);

  if (Platform.OS === "android") {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      Alert.alert("Permission required", "Please allow access to save files.");
      return;
    }
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      name,
      mime,
    );
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    Alert.alert("Downloaded", `${name} saved successfully.`);
    return;
  }

  const fileUri = `${FileSystem.documentDirectory}${encodeURIComponent(name)}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(fileUri, {
    mimeType: mime,
    dialogTitle: `Open ${name}`,
  });
}

export default function TaskAiResourceMatches({
  resources,
  embedded = false,
}: {
  resources: TaskAiResourceResult[];
  embedded?: boolean;
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (resources.length === 0) return null;

  return (
    <View className={embedded ? undefined : "mt-2 border-t border-slate-200 pt-2"}>
      {resources.slice(0, 5).map((r) => {
        const key = `${r.attachmentId}-${r.chunkIndex ?? 0}-${r.snippet?.slice(0, 24) ?? ""}`;
        const meta = [
          r.resourceType?.trim(),
          taskAiResourceLocationLabel(r),
          r.similarity != null
            ? `${Math.round(Number(r.similarity) * 100)}% match`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        const canOpen = !!taskAiResourceFilePath(r);
        const loading = busyKey === key;

        return (
          <View
            key={key}
            className="mb-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 last:mb-0"
          >
            <View className="flex-row items-start justify-between gap-2">
              <View className="min-w-0 flex-1 flex-row items-start gap-1.5">
                <AppIcon name="document-text-outline" size={14} color="#94A3B8" />
                <View className="min-w-0 flex-1">
                  <Text className="text-[11px] font-medium text-slate-800">
                    {r.fileName?.trim() || `Attachment #${r.attachmentId}`}
                  </Text>
                  {meta ? (
                    <Text className="text-[10px] text-slate-500">{meta}</Text>
                  ) : null}
                </View>
              </View>
              {canOpen ? (
                <Pressable
                  disabled={loading}
                  hitSlop={6}
                  onPress={async () => {
                    setBusyKey(key);
                    try {
                      await downloadResource(r);
                    } catch {
                      Alert.alert("Error", "Failed to open attachment.");
                    } finally {
                      setBusyKey(null);
                    }
                  }}
                  className="flex-row items-center gap-0.5 pt-0.5"
                  accessibilityLabel="Open resource"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#453956" />
                  ) : (
                    <>
                      <Text className="text-[10px] font-semibold text-primary">
                        Open
                      </Text>
                      <AppIcon
                        name="open-outline"
                        size={12}
                        color="#453956"
                      />
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
            {r.snippet?.trim() ? (
              <Text className="mt-1.5 text-[11px] leading-4 text-slate-500">
                {r.snippet.trim()}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
