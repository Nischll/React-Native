import { BASE_URL } from "@/src/constants/env";
import type { PrePostInspectionImageResponse } from "@/src/types/prePostInspection.types";

export function imageFileUrlById(imageId: number): string {
  const base = BASE_URL.replace(/\/?$/, "");
  return `${base}/pre-post-inspections/files/${imageId}`;
}

/** Prefer API `fileUrl` (relative or absolute); else `/files/{id}`. */
export function resolveInspectionImageUrl(
  img: PrePostInspectionImageResponse,
): string {
  const raw = img.fileUrl?.trim();
  if (raw) {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const origin = BASE_URL.replace(/\/api\/?$/, "");
    if (raw.startsWith("/api")) return `${origin}${raw}`;
    const base = BASE_URL.replace(/\/?$/, "");
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return `${base}${path}`;
  }
  return imageFileUrlById(img.id);
}
