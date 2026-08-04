import { Platform } from "react-native";

import { safeUploadFileName } from "@/src/helper/safeUploadFileName";

/**
 * Normalize a stored attachment title for a single path-segment encode.
 * iOS multipart sometimes stores percent-encoded names (e.g. "My%20File.pdf").
 */
export function attachmentTitlePathSegment(title: string): string {
  let decoded = String(title ?? "").trim();
  if (!decoded) return "";
  try {
    if (/%[0-9A-Fa-f]{2}/.test(decoded)) {
      decoded = decodeURIComponent(decoded);
    }
  } catch {
    // keep original
  }
  return encodeURIComponent(decoded);
}

/** RN FormData file part — matches working uploads elsewhere in this app. */
export function toMultipartFile(file: {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
}): { uri: string; name: string; type: string } {
  let uri = String(file.uri ?? "");

  if (Platform.OS === "ios") {
    // Established project pattern: iOS FormData fails or mis-sends with file://
    uri = uri.replace(/^file:\/\//, "");
    try {
      uri = decodeURI(uri);
    } catch {
      // keep as-is
    }
  } else if (uri.startsWith("/") && !uri.startsWith("file://")) {
    uri = `file://${uri}`;
  }

  return {
    uri,
    name: safeUploadFileName(file.name, file.mimeType),
    type: file.mimeType || "application/octet-stream",
  };
}
