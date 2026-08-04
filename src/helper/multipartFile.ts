import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { safeUploadFileName } from "@/src/helper/safeUploadFileName";

/**
 * Normalize a stored attachment title for a single path-segment encode.
 */
export function attachmentTitlePathSegment(title: string): string {
  let decoded = String(title ?? "").trim();
  if (!decoded) return "";
  try {
    if (/%[0-9A-Fa-f]{2}/.test(decoded)) {
      decoded = decodeURIComponent(decoded);
    }
  } catch {
    // keep original
  }
  return encodeURIComponent(decoded);
}

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return ".bin";
  const ext = name.slice(i).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/i.test(ext) ? ext : ".bin";
}

function guessMime(name: string, mime?: string | null): string {
  if (mime && mime !== "null" && mime !== "*/*") return mime;
  const ext = extFromName(name).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return map[ext] ?? "application/octet-stream";
}

/** Ensure Android multipart URIs always use file:// (OkHttp / RN requirement). */
function ensureAndroidFileUri(uri: string): string {
  let out = String(uri ?? "").trim();
  if (!out) return out;
  if (out.startsWith("file://")) return out;
  if (out.startsWith("/")) return `file://${out}`;
  return out;
}

/**
 * Prepare a FormData file part.
 * Android: copy into app cache with a simple ASCII path + file:// URI.
 * (content:// and poorly encoded paths commonly surface as Axios "Network Error".)
 * iOS: pass through picker URI unchanged.
 */
export async function prepareMultipartFile(file: {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
}): Promise<{ uri: string; name: string; type: string }> {
  const name = safeUploadFileName(file.name, file.mimeType);
  const type = guessMime(name, file.mimeType);

  if (Platform.OS !== "android") {
    return { uri: file.uri, name, type };
  }

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir || !file.uri) {
    return { uri: ensureAndroidFileUri(file.uri), name, type };
  }

  const dest = `${cacheDir}android-upload-${Date.now()}${extFromName(name)}`;

  try {
    await FileSystem.copyAsync({ from: file.uri, to: dest });
    return { uri: ensureAndroidFileUri(dest), name, type };
  } catch (copyErr) {
    // content:// and some providers fail copyAsync — read/write via base64
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(dest, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return { uri: ensureAndroidFileUri(dest), name, type };
    } catch (rwErr) {
      console.warn("prepareMultipartFile Android failed", copyErr, rwErr);
      return { uri: ensureAndroidFileUri(file.uri), name, type };
    }
  }
}
