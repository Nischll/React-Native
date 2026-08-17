import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

/** RN Android XHR often returns PDF bytes as a JS string, not ArrayBuffer. */
export function binaryToBase64(data: unknown): string {
  if (data == null) return "";

  if (typeof data === "string") {
    const start = data.trimStart();
    // Already base64 of a PDF ("%PDF" → JVBERi)
    if (start.startsWith("JVBERi")) {
      return data.replace(/\s/g, "");
    }
    return Buffer.from(data, "latin1").toString("base64");
  }

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    return data.toString("base64");
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(data)).toString("base64");
  }

  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return Buffer.from(
      new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
    ).toString("base64");
  }

  if (typeof data === "object" && data !== null && "data" in data) {
    return binaryToBase64((data as { data: unknown }).data);
  }

  try {
    return Buffer.from(data as ArrayBuffer).toString("base64");
  } catch {
    return "";
  }
}

export function isPdfBase64(base64: string): boolean {
  if (!base64) return false;
  try {
    const header = Buffer.from(base64, "base64")
      .subarray(0, 8)
      .toString("latin1");
    return header.startsWith("%PDF");
  } catch {
    return false;
  }
}

export function jsonMessageFromBinary(
  data: unknown,
  contentType?: string,
): string | null {
  const ct = String(contentType ?? "").toLowerCase();
  const looksJson =
    ct.includes("application/json") ||
    (typeof data === "string" && data.trimStart().startsWith("{"));
  if (!looksJson) return null;
  try {
    const text =
      typeof data === "string"
        ? data
        : Buffer.from(binaryToBase64(data), "base64").toString("utf8");
    const parsed = JSON.parse(text) as { message?: string };
    return parsed?.message ?? "Download failed";
  } catch {
    return null;
  }
}

/** Wait for a RN Modal to finish dismissing so Android can open the share sheet. */
export function waitForModalDismiss(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Write a PDF to app cache and open the system share/save sheet.
 * Avoids Android Storage Access Framework, which fails when a Modal is (or was) open.
 */
export async function saveAndSharePdf(
  fileName: string,
  base64: string,
): Promise<void> {
  const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!dir) {
    throw new Error("Storage is not available on this device.");
  }

  const safeName = fileName.replace(/[^\w.\-]+/g, "_");
  const fileUri = `${dir}${safeName}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert("Saved", `${safeName} was saved on this device.`);
    return;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/pdf",
    dialogTitle: `Save ${safeName}`,
    UTI: "com.adobe.pdf",
  });
}
