import * as FileSystem from "expo-file-system/legacy";

import { safeUploadFileName } from "@/src/helper/safeUploadFileName";

/**
 * Normalize a stored attachment title for a single path-segment encode.
 * iOS multipart sometimes stores percent-encoded names (e.g. "My%20File.pdf").
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
  return name.slice(i);
}

/**
 * Copy the picked file into app cache with a simple path, then build a FormData
 * file part. Avoids iOS/Android "Network Error" from inaccessible picker URIs,
 * spaces/encoding in paths, or stripping file:// incorrectly.
 */
export async function prepareMultipartFile(file: {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
}): Promise<{ uri: string; name: string; type: string }> {
  const name = safeUploadFileName(file.name, file.mimeType);
  const type = file.mimeType || "application/octet-stream";
  const cacheDir = FileSystem.cacheDirectory;

  if (!cacheDir || !file.uri) {
    return { uri: file.uri, name, type };
  }

  const dest = `${cacheDir}task-upload-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${extFromName(name)}`;

  try {
    await FileSystem.copyAsync({ from: file.uri, to: dest });
    return { uri: dest, name, type };
  } catch (e) {
    // Fallback: use original URI (still better than failing before request)
    console.warn("prepareMultipartFile copy failed, using original uri", e);
    return { uri: file.uri, name, type };
  }
}

/** @deprecated Prefer prepareMultipartFile — kept for sync call sites. */
export function toMultipartFile(file: {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
}): { uri: string; name: string; type: string } {
  return {
    uri: file.uri,
    name: safeUploadFileName(file.name, file.mimeType),
    type: file.mimeType || "application/octet-stream",
  };
}
