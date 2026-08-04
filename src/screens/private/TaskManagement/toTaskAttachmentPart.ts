import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

type UploadFileInput = {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
};

function fallbackName(mimeType?: string | null): string {
  const mime = mimeType ?? "";
  if (mime.includes("pdf")) return `attachment-${Date.now()}.pdf`;
  if (mime.startsWith("image/")) return `attachment-${Date.now()}.jpg`;
  return `attachment-${Date.now()}.bin`;
}

function ensureFileScheme(uri: string): string {
  let out = uri.trim();
  // Android sometimes returns "file:/path" instead of "file:///path"
  if (out.startsWith("file:/") && !out.startsWith("file://")) {
    out = `file://${out.slice("file:/".length)}`;
  }
  if (out.startsWith("/") && !out.startsWith("file://")) {
    out = `file://${out}`;
  }
  return out;
}

/**
 * Android FormData uploads fail (Network Error / request never sent) when the
 * picker returns content://, a broken file:/ URI, or missing name/type.
 * Copy into app cache with a simple file:// path and always set name + type.
 * iOS: pass through with safe name/type only.
 */
export async function toTaskAttachmentPart(file: UploadFileInput): Promise<{
  uri: string;
  name: string;
  type: string;
}> {
  const name =
    (file.name && String(file.name).trim()) || fallbackName(file.mimeType);
  const type = file.mimeType?.trim() || "application/octet-stream";

  if (Platform.OS !== "android") {
    return { uri: file.uri, name, type };
  }

  const cacheDir = FileSystem.cacheDirectory;
  let uri = file.uri;

  if (cacheDir) {
    const extMatch = /\.[a-z0-9]{1,8}$/i.exec(name);
    const ext = extMatch?.[0] ?? ".bin";
    const dest = `${cacheDir}task-att-${Date.now()}${ext}`;

    try {
      await FileSystem.copyAsync({ from: file.uri, to: dest });
      uri = dest;
    } catch {
      try {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.writeAsStringAsync(dest, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        uri = dest;
      } catch {
        // fall through with original uri
      }
    }
  }

  return { uri: ensureFileScheme(uri), name, type };
}
