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

function guessName(fallback: string, ref?: string | null): string {
  if (ref?.trim()) {
    const base = ref.split("/").pop() || ref.trim();
    if (base.includes(".")) return base;
  }
  return fallback;
}

/**
 * Download / open an authenticated API attachment (arraybuffer → share/save).
 * Absolute http(s) refs open directly.
 */
export async function viewAuthenticatedAttachment(params: {
  endpoint: string;
  fallbackName: string;
  attachmentRef?: string | null;
}): Promise<void> {
  const ref = params.attachmentRef?.trim();
  if (ref?.startsWith("http://") || ref?.startsWith("https://")) {
    const can = await Linking.canOpenURL(ref);
    if (!can) throw new Error("Cannot open attachment URL.");
    await Linking.openURL(ref);
    return;
  }

  const response = await apiService.get(params.endpoint, {
    responseType: "arraybuffer",
  });

  const disposition =
    (response.headers?.["content-disposition"] as string | undefined) ??
    (response.headers?.["Content-Disposition"] as string | undefined);
  const name =
    fileNameFromDisposition(disposition) ||
    guessName(params.fallbackName, ref);
  const mime = getMimeType(name);
  const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");

  if (Platform.OS === "android") {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to save the attachment.",
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

  const fileUri = `${FileSystem.cacheDirectory}${encodeURIComponent(name)}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: mime,
      dialogTitle: `Open ${name}`,
    });
  } else {
    Alert.alert("Downloaded", `${name} saved on device.`);
  }
}

/** GET /resident/form-k/{tenantId} */
export async function viewTenantFormK(params: {
  tenantId: number;
  formKFilePath?: string | null;
  formKFileUrl?: string | null;
}): Promise<void> {
  const ref = params.formKFileUrl?.trim() || params.formKFilePath?.trim();
  await viewAuthenticatedAttachment({
    endpoint: `/resident/form-k/${params.tenantId}`,
    fallbackName: `form-k-${params.tenantId}.pdf`,
    attachmentRef: ref?.startsWith("http") ? ref : params.formKFilePath,
  });
}

/** GET /access-device/{deviceId}/owner-approval */
export async function viewAccessDeviceOwnerApproval(params: {
  deviceId: number;
  ownerApproval?: string | null;
  ownerApprovalUrl?: string | null;
}): Promise<void> {
  const ref =
    params.ownerApprovalUrl?.trim() ||
    (typeof params.ownerApproval === "string"
      ? params.ownerApproval.trim()
      : "");
  await viewAuthenticatedAttachment({
    endpoint: `/access-device/${params.deviceId}/owner-approval`,
    fallbackName: `owner-approval-${params.deviceId}`,
    attachmentRef: ref?.startsWith("http") ? ref : ref || null,
  });
}
