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
  let trimmed = String(name ?? "").trim();
  // iOS pickers sometimes yield percent-encoded names; store decoded so download matches.
  try {
    if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
      trimmed = decodeURIComponent(trimmed);
    }
  } catch {
    // keep trimmed
  }
  // Strip path separators / characters that break Spring path downloads
  trimmed = trimmed.replace(/[/\\?*:|"<>#]/g, "_").trim();

  // Replace spaces — multipart Content-Disposition + download paths are more reliable
  trimmed = trimmed.replace(/\s+/g, "_");

  if (trimmed && trimmed.includes(".")) return trimmed;
  if (trimmed) return `${trimmed}${extFromMime(mimeType ?? undefined)}`;
  return `attachment-${Date.now()}${extFromMime(mimeType ?? undefined) || ".bin"}`;
}
