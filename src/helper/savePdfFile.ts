import { apiService } from "@/src/api/client";
import { BASE_URL } from "@/src/constants/env";
import { serializeQueryParams } from "@/src/helper/pdfClosingNames";
import { startGlobalLoading, stopGlobalLoading } from "@/src/utils/loadingBus";
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
  const v = value as { arrayBuffer?: unknown; size?: unknown; type?: unknown };
  return typeof v.arrayBuffer === "function" && "size" in v;
}

/** RN Android XHR / Axios may return PDF bytes as string, Blob, Buffer JSON, or ArrayBuffer. */
export async function responseDataToBase64(data: unknown): Promise<string> {
  if (data == null) return "";

  if (typeof data === "string") {
    const start = data.trimStart();
    if (start.startsWith("JVBERi")) return data.replace(/\s/g, "");
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
    return uint8ToBase64(
      Uint8Array.from((data as { data: number[] }).data),
    );
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

export function jsonMessageFromBinary(
  data: unknown,
  contentType?: string,
): string | null {
  const ct = String(contentType ?? "").toLowerCase();
  let text = "";
  if (typeof data === "string") text = data;
  else return ct.includes("application/json") ? "Download failed" : null;

  const looksJson =
    ct.includes("application/json") || text.trimStart().startsWith("{");
  if (!looksJson) return null;
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

function xhrGet(url: string, responseType: XMLHttpRequestResponseType) {
  return new Promise<{ status: number; data: unknown; contentType: string }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.withCredentials = true;
      xhr.timeout = 120000;
      try {
        xhr.responseType = responseType;
      } catch {
        xhr.responseType = "arraybuffer";
      }
      xhr.setRequestHeader("Accept", "application/pdf,*/*");

      xhr.onload = () => {
        resolve({
          status: xhr.status,
          data: xhr.response,
          contentType: xhr.getResponseHeader("content-type") ?? "",
        });
      };
      xhr.onerror = () =>
        reject(new Error("Network error while downloading the PDF."));
      xhr.ontimeout = () =>
        reject(new Error("PDF download timed out. Try again."));
      xhr.send();
    },
  );
}

async function pdfBase64FromXhrPayload(
  data: unknown,
  contentType: string,
): Promise<string> {
  const jsonError = jsonMessageFromBinary(data, contentType);
  if (jsonError) throw new Error(jsonError);
  const base64 = await responseDataToBase64(data);
  if (isPdfBase64(base64)) return base64;
  try {
    const text = Buffer.from(base64, "base64").toString("utf8");
    if (text.trimStart().startsWith("{")) {
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed?.message ?? "Download failed");
    }
  } catch (err) {
    if (err instanceof Error && err.message !== "INVALID_PDF") throw err;
  }
  throw new Error("INVALID_PDF");
}

/**
 * Download a PDF with session cookies. Uses XHR blob/arraybuffer so Android
 * does not UTF-8-decode (and corrupt) the file the way Axios often does.
 */
export async function downloadAuthenticatedPdf(
  path: string,
  params: Record<string, string | number | undefined | null> = {},
): Promise<string> {
  const query = serializeQueryParams(params);
  const url = `${BASE_URL.replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }${query ? `?${query}` : ""}`;

  const run = async (): Promise<string> => {
    try {
      const blobRes = await xhrGet(url, "blob");
      if (blobRes.status === 403) throw Object.assign(new Error("FORBIDDEN"), { status: 403 });
      if (blobRes.status < 200 || blobRes.status >= 300) {
        throw new Error(`Download failed (${blobRes.status}).`);
      }
      return await pdfBase64FromXhrPayload(blobRes.data, blobRes.contentType);
    } catch (err) {
      if ((err as { status?: number }).status === 403) throw err;
      const abRes = await xhrGet(url, "arraybuffer");
      if (abRes.status === 403) throw Object.assign(new Error("FORBIDDEN"), { status: 403 });
      if (abRes.status < 200 || abRes.status >= 300) {
        throw new Error(`Download failed (${abRes.status}).`);
      }
      return await pdfBase64FromXhrPayload(abRes.data, abRes.contentType);
    }
  };

  startGlobalLoading();
  try {
    try {
      return await run();
    } catch (err) {
      if ((err as { status?: number }).status !== 403) {
        if (err instanceof Error && err.message === "INVALID_PDF") {
          throw new Error(
            "Server did not return a valid PDF. Try again or check permissions.",
          );
        }
        throw err;
      }
      await apiService.post("/auth/refresh");
      try {
        return await run();
      } catch (retryErr) {
        if (retryErr instanceof Error && retryErr.message === "INVALID_PDF") {
          throw new Error(
            "Server did not return a valid PDF. Try again or check permissions.",
          );
        }
        throw retryErr;
      }
    }
  } finally {
    stopGlobalLoading();
  }
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

/** @deprecated use responseDataToBase64 */
export const binaryToBase64 = (data: unknown) => {
  if (typeof data === "string" && data.trimStart().startsWith("JVBERi")) {
    return data.replace(/\s/g, "");
  }
  if (typeof data === "string") {
    return Buffer.from(data, "latin1").toString("base64");
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
  return "";
};
