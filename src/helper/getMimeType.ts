function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function getMimeType(filename: string) {
  const ext = getFileExtension(filename);
  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
  };
  return mimeMap[ext] ?? "application/octet-stream";
}
