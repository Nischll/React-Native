import { apiService } from "@/src/api/client";
import { BASE_URL } from "@/src/constants/env";
import { toTaskAttachmentPart } from "@/src/screens/private/TaskManagement/toTaskAttachmentPart";
import {
  OCP_AREA_MAX,
  OCP_BASE_PATH,
  OCP_DESCRIPTION_MAX,
  OCP_TITLE_MAX,
  OcpDraftPhoto,
  OcpPhotoStatus,
  OcpSignatures,
} from "@/src/types/overnightConciergePatrol.types";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import { ocpSignatureQueryParams } from "./ocpSignatures";

export function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return (base || "Photo").slice(0, OCP_TITLE_MAX);
}

export function newOcpPhotoKey(): string {
  return `ocp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function assetToDraft(asset: ImagePicker.ImagePickerAsset): OcpDraftPhoto {
  const name =
    asset.fileName?.trim() ||
    asset.uri.split("/").pop() ||
    `photo-${Date.now()}.jpg`;
  const mimeType = asset.mimeType?.trim() || "image/jpeg";
  return {
    key: newOcpPhotoKey(),
    uri: asset.uri,
    name,
    mimeType,
    title: titleFromFilename(name),
    area: "",
    status: "NORMAL",
    description: "",
  };
}

async function ensureCameraPermission(): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const asked = await ImagePicker.requestCameraPermissionsAsync();
  if (asked.granted) return true;
  Alert.alert(
    "Camera permission",
    "Allow camera access to capture patrol photos.",
  );
  return false;
}

async function ensureLibraryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (asked.granted) return true;
  Alert.alert(
    "Photo library",
    "Allow photo library access to attach patrol photos.",
  );
  return false;
}

export async function pickOcpPhotosFromCamera(): Promise<OcpDraftPhoto[]> {
  const ok = await ensureCameraPermission();
  if (!ok) return [];
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.length) return [];
  return result.assets.map(assetToDraft);
}

export async function pickOcpPhotosFromLibrary(): Promise<OcpDraftPhoto[]> {
  const ok = await ensureLibraryPermission();
  if (!ok) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsMultipleSelection: true,
    selectionLimit: 12,
  });
  if (result.canceled || !result.assets?.length) return [];
  return result.assets.map(assetToDraft);
}

export function promptOcpPhotoSource(
  onPicked: (photos: OcpDraftPhoto[]) => void,
): void {
  Alert.alert("Add photo", "Choose a source", [
    {
      text: "Camera",
      onPress: async () => {
        const photos = await pickOcpPhotosFromCamera();
        if (photos.length) onPicked(photos);
      },
    },
    {
      text: "Photo library",
      onPress: async () => {
        const photos = await pickOcpPhotosFromLibrary();
        if (photos.length) onPicked(photos);
      },
    },
    { text: "Cancel", style: "cancel" },
  ]);
}

export function draftsAreComplete(photos: OcpDraftPhoto[]): boolean {
  if (photos.length === 0) return false;
  return photos.every(
    (p) => p.title.trim().length > 0 && p.area.trim().length > 0,
  );
}

export async function appendOcpDraftPhotos(
  fd: FormData,
  photos: OcpDraftPhoto[],
): Promise<void> {
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const part = await toTaskAttachmentPart({
      uri: photo.uri,
      name: photo.name,
      mimeType: photo.mimeType,
    });
    fd.append(`attachments[${i}].file`, part as any);
    fd.append(
      `attachments[${i}].title`,
      photo.title.trim().slice(0, OCP_TITLE_MAX),
    );
    fd.append(
      `attachments[${i}].area`,
      photo.area.trim().slice(0, OCP_AREA_MAX),
    );
    fd.append(`attachments[${i}].status`, photo.status);
    fd.append(
      `attachments[${i}].description`,
      photo.description.trim().slice(0, OCP_DESCRIPTION_MAX),
    );
  }
}

export async function buildOcpCellFormData(params: {
  buildingId: number;
  weekEnding: string;
  templateId: number;
  completedDate: string;
  isDone: boolean;
  completedTime?: string;
  employeeId?: number;
  photos?: OcpDraftPhoto[];
}): Promise<FormData> {
  const fd = new FormData();
  fd.append("buildingId", String(params.buildingId));
  fd.append("weekEnding", params.weekEnding);
  fd.append("templateId", String(params.templateId));
  fd.append("completedDate", params.completedDate);
  fd.append("isDone", params.isDone ? "true" : "false");
  if (params.isDone && params.completedTime) {
    fd.append("completedTime", params.completedTime);
  }
  if (params.employeeId != null) {
    fd.append("employeeId", String(params.employeeId));
  }
  if (params.isDone && params.photos?.length) {
    await appendOcpDraftPhotos(fd, params.photos);
  }
  return fd;
}

export async function buildOcpAddAttachmentsFormData(
  photos: OcpDraftPhoto[],
): Promise<FormData> {
  const fd = new FormData();
  await appendOcpDraftPhotos(fd, photos);
  return fd;
}

export async function buildOcpUpdateAttachmentFormData(params: {
  title: string;
  area: string;
  status: OcpPhotoStatus;
  description: string;
  file?: { uri: string; name: string; mimeType: string } | null;
}): Promise<FormData> {
  const fd = new FormData();
  fd.append("title", params.title.trim().slice(0, OCP_TITLE_MAX));
  fd.append("area", params.area.trim().slice(0, OCP_AREA_MAX));
  fd.append("status", params.status);
  fd.append(
    "description",
    params.description.trim().slice(0, OCP_DESCRIPTION_MAX),
  );
  if (params.file) {
    const part = await toTaskAttachmentPart({
      uri: params.file.uri,
      name: params.file.name,
      mimeType: params.file.mimeType,
    });
    fd.append("file", part as any);
  }
  return fd;
}

export function resolveOcpFileUrl(fileUrl?: string | null): string {
  const path = fileUrl?.trim() ?? "";
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/api")) {
    return `${BASE_URL.replace(/\/api\/?$/, "")}${path}`;
  }
  const base = BASE_URL.replace(/\/?$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function isSameApiHost(url: string): boolean {
  try {
    const target = new URL(url);
    const api = new URL(BASE_URL);
    return target.host === api.host;
  } catch {
    return false;
  }
}

function apiPathFromAbsolute(url: string): string {
  try {
    const target = new URL(url);
    const path = `${target.pathname}${target.search}`;
    if (path.startsWith("/api/")) return path.slice(4);
    return path;
  } catch {
    return url;
  }
}

/** Load a patrol photo with session cookies when the URL is on the API host. */
export async function fetchOcpImageDisplayUri(
  fileUrl?: string | null,
): Promise<string> {
  const resolved = resolveOcpFileUrl(fileUrl);
  if (!resolved) return "";
  if (!isSameApiHost(resolved)) return resolved;

  const response = await apiService.get(apiPathFromAbsolute(resolved), {
    responseType: "arraybuffer",
    transformResponse: (data) => data,
    headers: {
      Accept: "*/*",
      "Content-Type": undefined,
    },
  });
  const buffer = response.data as ArrayBuffer;
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = String(
    (response.headers as any)?.["content-type"] ?? "image/jpeg",
  );
  const mime = contentType.split(";")[0]?.trim() || "image/jpeg";
  return `data:${mime};base64,${base64}`;
}

export async function fetchOcpDailyPdf(params: {
  buildingId: number;
  date: string;
  employeeId?: number;
  signatures: OcpSignatures;
}) {
  const query: Record<string, string | number> = {
    buildingId: params.buildingId,
    date: params.date,
    ...ocpSignatureQueryParams(params.signatures),
  };
  if (params.employeeId != null) query.employeeId = params.employeeId;

  return apiService.get(`${OCP_BASE_PATH}/records/daily/pdf`, {
    params: query,
    responseType: "arraybuffer",
    transformResponse: (data) => data,
    timeout: 120000,
    headers: {
      Accept: "*/*",
      "Content-Type": undefined,
    },
  });
}

export async function saveOcpDailyPdf(params: {
  buildingId: number;
  date: string;
  employeeId?: number;
  signatures: OcpSignatures;
}): Promise<void> {
  const response = await fetchOcpDailyPdf(params);
  const contentType = String(
    response.headers?.["content-type"] ?? "",
  ).toLowerCase();
  const raw = response.data;

  if (contentType.includes("application/json")) {
    let msg = "Download failed";
    try {
      const text =
        typeof raw === "string"
          ? raw
          : Buffer.from(raw as ArrayBuffer).toString("utf8");
      const j = JSON.parse(text) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const header = Buffer.from(raw as ArrayBuffer).subarray(0, 4).toString("utf8");
  if (header !== "%PDF") {
    throw new Error(
      "Server did not return a valid PDF. Try again or check permissions.",
    );
  }

  const fileName = `Overnight_Concierge_Patrol_${params.date}.pdf`;
  const base64 = Buffer.from(raw as ArrayBuffer).toString("base64");

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
      fileName,
      "application/pdf",
    );
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    Alert.alert("Downloaded", `${fileName} saved successfully.`);
    return;
  }

  if (!FileSystem.documentDirectory) {
    throw new Error("Storage is not available on this device.");
  }
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert("Saved", `${fileName} was saved on device.`);
    return;
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: "application/pdf",
    dialogTitle: `Save ${fileName}`,
    UTI: "com.adobe.pdf",
  });
}
