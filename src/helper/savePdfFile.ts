import { apiService } from "@/src/api/client";
import { BASE_URL } from "@/src/constants/env";
import { serializeQueryParams } from "@/src/helper/pdfClosingNames";
import { ENABLE_DEBUG_LOGS } from "@/src/utils/debug";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

function uint8ToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function looksLikePdf(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.length, 1024);
  for (let i = 0; i <= limit - 4; i++) {
    if (
      bytes[i] === 0x25 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x44 &&
      bytes[i + 3] === 0x46
    ) {
      return true;
    }
  }
  return false;
}

function stringToBytes(value: string): Uint8Array {
  const out = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    out[i] = value.charCodeAt(i) & 0xff;
  }
  return out;
}

async function readBlobBytes(data: unknown): Promise<Uint8Array | null> {
  if (!data || typeof data !== "object" || typeof FileReader === "undefined") {
    return null;
  }
  try {
    const result = await new Promise<string | ArrayBuffer | null>(
      (resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        if (typeof reader.readAsArrayBuffer === "function") {
          reader.readAsArrayBuffer(data as Blob);
        } else {
          reader.readAsDataURL(data as Blob);
        }
      },
    );
    if (result instanceof ArrayBuffer) return new Uint8Array(result);
    if (typeof result === "string") {
      const comma = result.indexOf(",");
      const b64 = comma >= 0 ? result.slice(comma + 1) : result;
      return new Uint8Array(Buffer.from(b64, "base64"));
    }
  } catch {
    return null;
  }
  return null;
}

async function toPdfBytes(data: unknown): Promise<Uint8Array | null> {
  if (data == null) return null;

  if (typeof data === "string") {
    if (data.trimStart().startsWith("JVBERi")) {
      return new Uint8Array(Buffer.from(data.replace(/\s/g, ""), "base64"));
    }
    return stringToBytes(data);
  }

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    return new Uint8Array(data);
  }

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "number") {
    return Uint8Array.from(data);
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }

  const blobBytes = await readBlobBytes(data);
  if (blobBytes) return blobBytes;

  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    if (rec.type === "Buffer" && Array.isArray(rec.data)) {
      return Uint8Array.from(rec.data as number[]);
    }
    if (typeof rec.byteLength === "number") {
      try {
        return new Uint8Array(data as ArrayBuffer);
      } catch {
        /* ignore */
      }
    }
    try {
      const copied = Buffer.from(data as ArrayBuffer);
      if (copied.length > 0) return new Uint8Array(copied);
    } catch {
      /* ignore */
    }
    if ("data" in rec) return toPdfBytes(rec.data);
    if ("_data" in rec) return toPdfBytes(rec._data);
  }

  return null;
}

function bytesFromAxiosResponse(response: {
  data?: unknown;
  request?: { response?: unknown; _response?: unknown; responseText?: string };
}): unknown[] {
  const req = response.request;
  const sources: unknown[] = [response.data];
  if (req?.response != null) sources.push(req.response);
  if (req?._response != null) sources.push(req._response);
  try {
    if (typeof req?.responseText === "string") sources.push(req.responseText);
  } catch {
    /* responseText throws when responseType is not text */
  }
  return sources;
}

export function waitForModalDismiss(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const pdfHeaders = {
  Accept: "application/pdf",
  "Accept-Encoding": "identity",
};

const pdfRequestConfig = {
  responseType: "arraybuffer" as const,
  transformResponse: [(data: unknown) => data],
  timeout: 120000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  headers: pdfHeaders,
  decompress: false as const,
};

async function pdfBase64FromResponse(response: {
  data?: unknown;
  headers?: Record<string, unknown>;
  request?: { response?: unknown; _response?: unknown; responseText?: string };
}): Promise<string | null> {
  const sources = bytesFromAxiosResponse(response);
  if (ENABLE_DEBUG_LOGS) {
    const sample = response.data;
    console.log("📄 PDF payload type:", typeof sample);
    console.log(
      "📄 PDF constructor:",
      sample && typeof sample === "object"
        ? (sample as object).constructor?.name
        : "",
    );
    if (sample && typeof sample === "object") {
      console.log("📄 PDF keys:", Object.keys(sample as object).slice(0, 12));
    }
  }

  for (const source of sources) {
    const bytes = await toPdfBytes(source);
    if (!bytes || bytes.byteLength < 5) continue;
    if (ENABLE_DEBUG_LOGS) {
      const head = Array.from(bytes.subarray(0, 8))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
      console.log("📄 PDF first bytes:", head, "len", bytes.byteLength);
    }
    if (looksLikePdf(bytes)) return uint8ToBase64(bytes);
  }
  return null;
}

function jsonErrorFromBytes(bytes: Uint8Array | null): string | null {
  if (!bytes || bytes.byteLength > 8000) return null;
  try {
    const text = Buffer.from(bytes).toString("utf8").trim();
    if (!text.startsWith("{")) return null;
    const parsed = JSON.parse(text) as { message?: string };
    return parsed?.message ?? null;
  } catch {
    return null;
  }
}

async function downloadPdfNative(
  path: string,
  params: Record<string, string | number>,
): Promise<string | null> {
  const query = serializeQueryParams(params);
  const url = `${BASE_URL.replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }${query ? `?${query}` : ""}`;
  const dest = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}ocp-pdf-${Date.now()}.pdf`;
  try {
    const result = await FileSystem.downloadAsync(url, dest, {
      headers: pdfHeaders,
    });
    if (result.status !== 200) return null;
    const b64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = new Uint8Array(Buffer.from(b64, "base64"));
    if (looksLikePdf(bytes)) return b64;
  } catch {
    return null;
  }
  return null;
}

/**
 * Fetch a PDF through the shared axios client (same cookies as the rest of the app).
 * Android often returns a native Blob / gzip bytes instead of a JS ArrayBuffer —
 * we decode those shapes and also disable gzip so the body starts with %PDF.
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

  let base64 = await pdfBase64FromResponse(response);
  if (base64) return base64;

  const firstBytes = await toPdfBytes(response.data);
  const jsonError = jsonErrorFromBytes(firstBytes);
  if (jsonError) throw new Error(jsonError);

  const blobResponse = await apiService.get(path, {
    params: cleanParams,
    ...pdfRequestConfig,
    responseType: "blob",
  });
  base64 = await pdfBase64FromResponse(blobResponse);
  if (base64) return base64;

  const nativeB64 = await downloadPdfNative(path, cleanParams);
  if (nativeB64) return nativeB64;

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
