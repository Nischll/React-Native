function extFromMime(mime?: string): string {
  if (!mime) return "";
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
  };
  return map[mime] ?? "";
}

/** Ensure RN multipart file parts always have a usable filename (backend stores this as title). */
export function safeUploadFileName(
  name?: string | null,
  mimeType?: string | null,
): string {
  const trimmed = String(name ?? "").trim();
  if (trimmed && trimmed.includes(".")) return trimmed;
  if (trimmed) return `${trimmed}${extFromMime(mimeType ?? undefined)}`;
  return `attachment-${Date.now()}${extFromMime(mimeType ?? undefined) || ".bin"}`;
}
