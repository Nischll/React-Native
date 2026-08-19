import { Employee } from "../types/employee.types";
import {
  PRIVATE_INBOX_LIMIT,
  PRIVATE_THREAD_LIMIT,
  PrivateInboxResponse,
  PrivateThreadResponse,
  SendPrivateMessagePayload,
} from "../types/privateMessage.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";
import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";

export const PRIVATE_INBOX_KEY = "/communication/private/inbox";
export const PRIVATE_THREAD_KEY = "/communication/private/thread";

export function useGetPrivateInbox(
  page = 1,
  limit = PRIVATE_INBOX_LIMIT,
  enabled = true,
) {
  return useApiQuery<PrivateInboxResponse>(PRIVATE_INBOX_KEY, {
    enabled,
    queryParams: { page, limit },
    retry: 0,
  });
}

export function useGetPrivateThread(
  otherUserId: number | null,
  page = 1,
  limit = PRIVATE_THREAD_LIMIT,
) {
  return useApiQuery<PrivateThreadResponse>(PRIVATE_THREAD_KEY, {
    enabled: otherUserId != null && otherUserId > 0,
    queryParams:
      otherUserId != null
        ? { otherUserId, page, limit }
        : undefined,
    retry: 0,
  });
}

export function useSendPrivateMessage() {
  return useApiMutation<SendPrivateMessagePayload>(
    "post",
    "/communication/private",
    { showSuccessToast: false },
  );
}

export function useDeletePrivateMessage() {
  return useApiMutation<{ id: number }, unknown, { id: number }>(
    "delete",
    (vars) => `/communication/${vars?.id}`,
    { showSuccessToast: false },
  );
}

export function useMarkPrivateMessageSeen() {
  return useApiMutation<{ communicationId: number; reactionType: "SEEN" }>(
    "post",
    "/communication-reaction",
    { showSuccessToast: false },
  );
}

/** Spec: GET /api/get-user?page&limit&search */
export function useSearchPrivateUsers(
  page = 1,
  limit = 20,
  search = "",
  enabled = true,
) {
  return useApiQuery<ApiListResponse<ApiPaginatedData<Employee> | Employee[]>>(
    "/get-user",
    {
      enabled,
      retry: 0,
      queryParams: {
        page,
        limit,
        ...(search.trim() ? { search: search.trim() } : {}),
      },
    },
  );
}
