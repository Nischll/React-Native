import { apiService } from "@/src/api/client";
import { serializeQueryParams } from "@/src/helper/pdfClosingNames";
import { ENABLE_DEBUG_LOGS } from "@/src/utils/debug";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

function headerContentType(headers: unknown): string {
  if (!headers || typeof headers !== "object") return "";
  const h = headers as Record<string, unknown> & {
    get?: (key: string) => unknown;
  };
  if (typeof h.get === "function") {
    return String(h.get("content-type") ?? h.get("Content-Type") ?? "");
  }
  return String(h["content-type"] ?? h["Content-Type"] ?? "");
}

function isBlobLike(value: unknown): value is Blob {
  if (!value || typeof value !== "object") return false;
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  const rec = value as { size?: unknown; arrayBuffer?: unknown; type?: unknown };
  return (
    typeof rec.size === "number" &&
    (typeof rec.arrayBuffer === "function" ||
      typeof rec.type === "string" ||
      "_data" in rec)
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("Could not read the PDF file."));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read the PDF file."));
    // Same idea as the web app's blob download: read the Blob as-is.
    // readAsArrayBuffer is unreliable on RN Android native Blobs.
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert axios binary the same way working downloads in this app do
 * (ResourceDetails, TaskAttachments), plus Blob → data URL like the web app.
 */
async function responseDataToBase64(data: unknown): Promise<string> {
  if (data == null) return "";

  if (typeof data === "string") {
    const trimmed = data.trimStart();
    if (trimmed.startsWith("JVBERi")) {
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
      view.buffer,
      view.byteOffset,
      view.byteLength,
    ).toString("base64");
  }

  if (isBlobLike(data)) {
    if (typeof data.arrayBuffer === "function") {
      try {
        const buf = await data.arrayBuffer();
        if (buf?.byteLength) {
          return Buffer.from(new Uint8Array(buf)).toString("base64");
        }
      } catch {
        /* fall through to FileReader */
      }
    }
    return blobToBase64(data);
  }

  // Same conversion ResourceDetails / TaskAttachments use successfully.
  return Buffer.from(data as ArrayBuffer).toString("base64");
}

function jsonErrorFromPayload(
  data: unknown,
  contentType: string,
  base64: string,
): string | null {
  const ct = contentType.toLowerCase();
  if (ct.includes("application/pdf") || ct.includes("octet-stream")) {
    return null;
  }

  let text = "";
  if (typeof data === "string") {
    text = data;
  } else if (base64 && base64.length < 12000) {
    try {
      text = Buffer.from(base64, "base64").toString("utf8");
    } catch {
      return null;
    }
  }

  const looksJson =
    ct.includes("application/json") || text.trimStart().startsWith("{");
  if (!looksJson || text.length > 8000) return null;
  try {
    const parsed = JSON.parse(text) as { message?: string };
    return parsed?.message ?? "Download failed";
  } catch {
    return null;
  }
}

export function waitForModalDismiss(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a PDF the way the web app does: cookie-auth GET, treat the body as a
 * file, and save it. Do not require a `%PDF` magic check — the browser never
 * does, and Android often wraps bytes in a Blob that fails that test.
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
    paramsSerializer: serializeQueryParams,
    responseType: "arraybuffer",
    transformResponse: [(data: unknown) => data],
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      Accept: "application/pdf,*/*",
    },
  });

  const contentType = headerContentType(response.headers);
  if (ENABLE_DEBUG_LOGS) {
    const sample = response.data;
    console.log("📄 PDF content-type:", contentType);
    console.log("📄 PDF payload type:", typeof sample);
    console.log(
      "📄 PDF constructor:",
      sample && typeof sample === "object"
        ? (sample as object).constructor?.name
        : "",
    );
  }

  let base64 = await responseDataToBase64(response.data);
  if (base64.length < 32) {
    const raw = (response.request as { _response?: unknown } | undefined)
      ?._response;
    if (raw != null) {
      const fromXhr = await responseDataToBase64(raw);
      if (fromXhr.length > base64.length) base64 = fromXhr;
    }
  }

  if (base64.length < 32) {
    const blobResponse = await apiService.get(path, {
      params: cleanParams,
      paramsSerializer: serializeQueryParams,
      responseType: "blob",
      transformResponse: [(data: unknown) => data],
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        Accept: "application/pdf,*/*",
      },
    });
    base64 = await responseDataToBase64(blobResponse.data);
  }

  const jsonError = jsonErrorFromPayload(response.data, contentType, base64);
  if (jsonError) throw new Error(jsonError);

  if (!base64 || base64.length < 32) {
    throw new Error(
      "Server did not return a valid PDF. Try again or check permissions.",
    );
  }

  return base64;
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
