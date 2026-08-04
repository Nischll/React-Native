import { apiService } from "@/src/api/client";
import { getMimeType } from "@/src/helper/getMimeType";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert, Linking, Platform } from "react-native";

function fileNameFromDisposition(disposition?: string): string | null {
  if (!disposition) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const ascii = /filename="([^"]+)"/i.exec(disposition);
  const ascii2 = /filename=([^;\s]+)/i.exec(disposition);
  const raw = utf8?.[1] ?? ascii?.[1] ?? ascii2?.[1];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw.replace(/['"]/g, ""));
  } catch {
    return raw.replace(/['"]/g, "");
  }
}

function guessNameFromRef(ref?: string | null, bookingId?: number): string {
  if (ref?.trim()) {
    const base = ref.split("/").pop() || ref.trim();
    if (base.includes(".")) return base;
    return `${base}`;
  }
  return `deposit-attachment-${bookingId ?? "file"}`;
}

/**
 * Download / open booking deposit attachment (same endpoint as web).
 * GET /booking/{id}/deposit-attachment — or open absolute URL if stored as http(s).
 */
export async function downloadDepositAttachment(params: {
  bookingId: number;
  attachmentRef?: string | null;
}): Promise<void> {
  const ref = params.attachmentRef?.trim();
  if (ref?.startsWith("http://") || ref?.startsWith("https://")) {
    const can = await Linking.canOpenURL(ref);
    if (!can) throw new Error("Cannot open attachment URL.");
    await Linking.openURL(ref);
    return;
  }

  const response = await apiService.get(
    `/booking/${params.bookingId}/deposit-attachment`,
    { responseType: "arraybuffer" },
  );

  const disposition =
    (response.headers?.["content-disposition"] as string | undefined) ??
    (response.headers?.["Content-Disposition"] as string | undefined);
  const name =
    fileNameFromDisposition(disposition) ||
    guessNameFromRef(ref, params.bookingId);
  const mime = getMimeType(name);
  const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");

  if (Platform.OS === "android") {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to save the deposit attachment.",
      );
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
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: mime,
      dialogTitle: `Save ${name}`,
    });
  } else {
    Alert.alert("Downloaded", `${name} saved on device.`);
  }
}
