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

export type TaskAiChatResponseData = {
  question?: string;
  suggestedActionTaken?: string | null;
  rationale?: string | null;
  similarExamples?: TaskAiSimilarExample[] | null;
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
  if (
    nested &&
    ("suggestedActionTaken" in nested ||
      "rationale" in nested ||
      "similarExamples" in nested ||
      "question" in nested)
  ) {
    return nested as TaskAiChatResponseData;
  }
  if (
    "suggestedActionTaken" in bodyObj ||
    "rationale" in bodyObj ||
    "similarExamples" in bodyObj
  ) {
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
