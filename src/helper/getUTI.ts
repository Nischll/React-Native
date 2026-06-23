function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function getUTI(filename: string) {
  const ext = getFileExtension(filename);
  const utiMap: Record<string, string> = {
    pdf: "com.adobe.pdf",
    doc: "com.microsoft.word.doc",
    docx: "org.openxmlformats.wordprocessingml.document",
    xls: "com.microsoft.excel.xls",
    xlsx: "org.openxmlformats.spreadsheetml.sheet",
    csv: "public.comma-separated-values-text",
    zip: "public.zip-archive",
    rar: "com.rarlab.rar-archive",
  };
  return utiMap[ext] ?? "public.data";
}
