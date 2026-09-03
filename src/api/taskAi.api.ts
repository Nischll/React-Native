import { useMemo } from "react";
import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  TaskAiChatRequest,
  TaskAiChatResponseData,
  TaskAiStatusResponseData,
  extractTaskAiStatus,
} from "../types/taskAi.types";
import { ApiListResponse } from "./auth.api";

export const useTaskAiChat = () =>
  useApiMutation<TaskAiChatRequest, TaskAiChatResponseData>(
    "post",
    "/task-ai/chat",
    {
      showSuccessToast: false,
      skipGlobalLoading: true,
    },
  );

export const useTaskAiTrain = () =>
  useApiMutation("post", "/task-ai/train", {
    successMessage: "Model training started",
    skipGlobalLoading: true,
  });

export const useTaskAiStatus = (enabled = true) =>
  useApiQuery<ApiListResponse<TaskAiStatusResponseData>>("/task-ai/status", {
    enabled,
    retry: 0,
    axiosConfig: { skipGlobalLoading: true },
  });

export function useTaskAiModelStatus(enabled = true) {
  const query = useTaskAiStatus(enabled);
  const status = useMemo(
    () => extractTaskAiStatus(query.data),
    [query.data],
  );
  return {
    ...query,
    status,
    modelReady: status?.modelReady !== false,
    trainedAt: status?.trainedAt ?? null,
  };
}
