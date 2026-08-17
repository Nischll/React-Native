import { apiService } from "@/src/api/client";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

function uint8ToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read the PDF file."));
    reader.readAsDataURL(blob);
  });
}

function isBlobLike(value: unknown): value is Blob {
  if (!value || typeof value !== "object") return false;
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  const v = value as { arrayBuffer?: unknown; size?: unknown };
  return typeof v.arrayBuffer === "function" && "size" in v;
}

export async function responseDataToBase64(data: unknown): Promise<string> {
  if (data == null) return "";

  if (typeof data === "string") {
    const start = data.trimStart();
    if (start.startsWith("JVBERi")) return data.replace(/\s/g, "");
    if (start.startsWith("%PDF")) {
      return Buffer.from(data, "latin1").toString("base64");
    }
    return Buffer.from(data, "latin1").toString("base64");
  }

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    return data.toString("base64");
  }

  if (Array.isArray(data) && data.every((n) => typeof n === "number")) {
    return uint8ToBase64(Uint8Array.from(data));
  }

  if (
    data &&
    typeof data === "object" &&
    (data as { type?: string }).type === "Buffer" &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return uint8ToBase64(Uint8Array.from((data as { data: number[] }).data));
  }

  if (isBlobLike(data)) {
    try {
      return await blobToBase64(data);
    } catch {
      if (typeof data.arrayBuffer === "function") {
        const ab = await data.arrayBuffer();
        return uint8ToBase64(new Uint8Array(ab));
      }
    }
  }

  if (data instanceof ArrayBuffer) {
    return uint8ToBase64(new Uint8Array(data));
  }

  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return uint8ToBase64(
      new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
    );
  }

  if (
    data &&
    typeof data === "object" &&
    typeof (data as ArrayBuffer).byteLength === "number"
  ) {
    try {
      return uint8ToBase64(new Uint8Array(data as ArrayBuffer));
    } catch {
      /* fall through */
    }
  }

  if (typeof data === "object" && data !== null && "data" in data) {
    return responseDataToBase64((data as { data: unknown }).data);
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

function messageFromFailedPayload(base64: string, contentType: string): string | null {
  const ct = String(contentType ?? "").toLowerCase();
  try {
    const text = Buffer.from(base64, "base64").toString("utf8");
    const start = text.trimStart();
    if (ct.includes("application/json") || start.startsWith("{")) {
      const parsed = JSON.parse(text) as { message?: string };
      return parsed?.message ?? "Download failed";
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function waitForModalDismiss(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const pdfRequestConfig = {
  responseType: "arraybuffer" as const,
  transformResponse: [(data: unknown) => data],
  timeout: 120000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  headers: {
    Accept: "application/pdf",
  },
};

/**
 * Fetch a PDF through the shared axios client so cookies, refresh, and
 * interceptors match every other API call in the app.
 */
export async function downloadAuthenticatedPdf(
  path: string,
  params: Record<string, string | number | undefined | null> = {},
): Promise<string> {
  const cleanParams: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null || String(value) === "") continue;
    cleanParams[key] = value;
  }

  const response = await apiService.get(path, {
    params: cleanParams,
    ...pdfRequestConfig,
  });

  const contentType = String(response.headers?.["content-type"] ?? "");
  const base64 = await responseDataToBase64(response.data);
  if (isPdfBase64(base64)) return base64;

  const jsonError = messageFromFailedPayload(base64, contentType);
  if (jsonError) throw new Error(jsonError);

  const blobResponse = await apiService.get(path, {
    params: cleanParams,
    ...pdfRequestConfig,
    responseType: "blob",
  });
  const blobBase64 = await responseDataToBase64(blobResponse.data);
  if (isPdfBase64(blobBase64)) return blobBase64;

  const blobJsonError = messageFromFailedPayload(blobBase64, contentType);
  if (blobJsonError) throw new Error(blobJsonError);

  throw new Error(
    "Server did not return a valid PDF. Try again or check permissions.",
  );
}

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
