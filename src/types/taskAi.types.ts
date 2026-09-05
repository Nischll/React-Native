export type TaskAiChatRequest = {
  question: string;
  buildingId?: number | null;
};

export type TaskAiSimilarExample = {
  taskId: number;
  title?: string | null;
  description?: string | null;
  actionTaken?: string | null;
  similarity?: number | null;
};

export type TaskAiResourceResult = {
  attachmentId: number;
  resourceId?: number | null;
  resourceType?: string | null;
  fileName?: string | null;
  storedPath?: string | null;
  chunkIndex?: number | null;
  snippet?: string | null;
  similarity?: number | null;
  pageStart?: number | null;
  pageEnd?: number | null;
  lineStart?: number | null;
  lineEnd?: number | null;
  sheetName?: string | null;
  locationLabel?: string | null;
  downloadUrl?: string | null;
};

/** File location for a resource hit (API `locationLabel`, else pages/lines/sheet). */
export function taskAiResourceLocationLabel(
  result: TaskAiResourceResult,
): string | null {
  const labeled = result.locationLabel?.trim();
  if (labeled) return labeled;
  const sheet = result.sheetName?.trim();
  if (result.pageStart != null || result.pageEnd != null) {
    const start = result.pageStart ?? result.pageEnd;
    const end = result.pageEnd ?? result.pageStart;
    const pages =
      start != null && end != null && start !== end
        ? `pages ${start}–${end}`
        : `page ${start}`;
    return sheet ? `${sheet} · ${pages}` : pages;
  }
  if (result.lineStart != null || result.lineEnd != null) {
    const start = result.lineStart ?? result.lineEnd;
    const end = result.lineEnd ?? result.lineStart;
    const lines =
      start != null && end != null && start !== end
        ? `lines ${start}–${end}`
        : `line ${start}`;
    return sheet ? `${sheet} · ${lines}` : lines;
  }
  return sheet || null;
}

export type TaskAiChatResponseData = {
  question?: string;
  suggestedActionTaken?: string | null;
  rationale?: string | null;
  similarExamples?: TaskAiSimilarExample[] | null;
  resourceResults?: TaskAiResourceResult[] | null;
  resourceMessage?: string | null;
};

export type TaskAiStatusResponseData = {
  modelReady?: boolean;
  versionNo?: number | string | null;
  trainedAt?: string | null;
};

export function buildTaskAiQuestion(parts: {
  title?: string;
  description?: string;
  location?: string;
}): string {
  return [parts.title?.trim(), parts.description?.trim(), parts.location?.trim()]
    .filter(Boolean)
    .join("\n\n");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function isTaskAiChatPayload(obj: Record<string, unknown>): boolean {
  return (
    "suggestedActionTaken" in obj ||
    "rationale" in obj ||
    "similarExamples" in obj ||
    "question" in obj ||
    "resourceResults" in obj ||
    "resourceMessage" in obj
  );
}

/** Primary bubble text: task suggestion, else resource count, else rationale. */
export function taskAiAssistantPrimaryText(
  data: TaskAiChatResponseData | null,
): string {
  const suggestion = data?.suggestedActionTaken?.trim();
  if (suggestion) return suggestion;
  const resourceMsg = data?.resourceMessage?.trim();
  if (resourceMsg) return resourceMsg;
  const rationale = data?.rationale?.trim();
  if (rationale) return rationale;
  return "No suggestion returned. Try rephrasing the issue.";
}

/** Authenticated API path or absolute URL for a resource hit. */
export function taskAiResourceFilePath(
  result: TaskAiResourceResult,
): string | null {
  const raw = result.downloadUrl?.trim();
  if (raw) {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const withoutApiPrefix = raw.replace(/^\/api(?=\/)/, "");
    return withoutApiPrefix.startsWith("/")
      ? withoutApiPrefix
      : `/${withoutApiPrefix}`;
  }
  if (result.attachmentId != null) {
    return `/resources/files/${result.attachmentId}`;
  }
  return null;
}

/** Handles `{ data }`, `{ data: { data } }`, and Axios `{ data: { data } }`. */
export function extractTaskAiChatData(
  response: unknown,
): TaskAiChatResponseData | null {
  const root = asRecord(response);
  if (!root) return null;
  const body = "data" in root ? root.data : root;
  const bodyObj = asRecord(body);
  if (!bodyObj) return null;
  const nested = asRecord(bodyObj.data);
  if (nested && isTaskAiChatPayload(nested)) {
    return nested as TaskAiChatResponseData;
  }
  if (isTaskAiChatPayload(bodyObj)) {
    return bodyObj as TaskAiChatResponseData;
  }
  return (nested ?? bodyObj) as TaskAiChatResponseData;
}

export function extractTaskAiStatus(
  response: unknown,
): TaskAiStatusResponseData | null {
  const root = asRecord(response);
  if (!root) return null;
  const body = "data" in root ? root.data : root;
  const bodyObj = asRecord(body);
  if (!bodyObj) return null;
  const nested = asRecord(bodyObj.data);
  if (nested && ("modelReady" in nested || "trainedAt" in nested)) {
    return nested as TaskAiStatusResponseData;
  }
  if ("modelReady" in bodyObj || "trainedAt" in bodyObj) {
    return bodyObj as TaskAiStatusResponseData;
  }
  return (nested ?? bodyObj) as TaskAiStatusResponseData;
}

export function taskAiErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ??
    err?.message ??
    "Something went wrong. Please try again."
  );
}
