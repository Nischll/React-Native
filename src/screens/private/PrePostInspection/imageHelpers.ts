import { apiService } from "@/src/api/client";
import { BASE_URL } from "@/src/constants/env";
import type { PrePostInspectionImageResponse } from "@/src/types/prePostInspection.types";
import { Buffer } from "buffer";

export function imageFileUrlById(imageId: number): string {
  const base = BASE_URL.replace(/\/?$/, "");
  return `${base}/pre-post-inspections/files/${imageId}`;
}

/** Prefer API `fileUrl` (relative or absolute); else `/files/{id}`. */
export function resolveInspectionImageUrl(
  img: Pick<PrePostInspectionImageResponse, "id" | "fileUrl">,
): string {
  const raw = img.fileUrl?.trim();
  if (raw) {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/api")) {
      return `${BASE_URL.replace(/\/api\/?$/, "")}${raw}`;
    }
    const base = BASE_URL.replace(/\/?$/, "");
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return `${base}${path}`;
  }
  if (img.id != null) return imageFileUrlById(img.id);
  return "";
}

/**
 * Load PPI image via axios (session cookies) → data URI.
 * RN `<Image uri>` cannot attach auth cookies, so this is required for display.
 */
export async function fetchInspectionImageDataUri(
  imageId: number,
): Promise<string> {
  const response = await apiService.get(
    `/pre-post-inspections/files/${imageId}`,
    {
      responseType: "arraybuffer",
      transformResponse: (data) => data,
      headers: {
        Accept: "*/*",
        "Content-Type": undefined,
      },
    },
  );
  const buffer = response.data as ArrayBuffer;
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = String(
    (response.headers as any)?.["content-type"] ?? "image/jpeg",
  );
  const mime = contentType.split(";")[0]?.trim() || "image/jpeg";
  return `data:${mime};base64,${base64}`;
}
