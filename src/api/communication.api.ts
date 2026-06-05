import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReactionUser {
  userId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  fullName: string;
}

export interface Reaction {
  reactionType: string;
  count: number;
  users: ReactionUser[];
}

export interface CommunicationItem {
  id: number;
  message: string;
  createdDate: string;
  parentId: number | null;
  createdBy: number;
  createdByFullName: string;
  seen: boolean | null;
  reactions: Reaction[];
  replies: CommunicationItem[];
  buildingIds: number[] | null;
  employeeIds: number[] | null;
}

export interface CommunicationListResponse {
  statusCode: number;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    unseenCount: number;
    data: CommunicationItem[];
  };
}

export interface CreateCommunicationPayload {
  message: string;
  parentId: number | null;
  employeeIds?: number[] | null;
  buildingIds?: number[] | null;
}

export interface UpdateCommunicationPayload {
  id: number;
  message: string;
  parentId: number | null;
  employeeIds?: number[] | null;
  buildingIds?: number[] | null;
}

export interface ReactionPayload {
  communicationId: number;
  reactionType: string;
  userId: number;
}

// ─── Query Key ────────────────────────────────────────────────────────────────

export const COMMUNICATION_KEY = "/communication";

// ─── GET: list ────────────────────────────────────────────────────────────────

export function useGetCommunications(page = 1, limit = 20) {
  return useApiQuery<CommunicationListResponse>(COMMUNICATION_KEY, {
    queryParams: { page, limit },
  });
}

// ─── POST: create notice or reply ────────────────────────────────────────────

export function useCreateCommunication() {
  const qc = useQueryClient();
  return useApiMutation<CreateCommunicationPayload>("post", COMMUNICATION_KEY, {
    showSuccessToast: false,
    // invalidate after success so list refreshes
  });
  // Note: call qc.invalidateQueries in onSuccess at the call site, or wrap:
}

export function useCreateCommunicationWithRefresh() {
  const qc = useQueryClient();

  const mutation = useApiMutation<CreateCommunicationPayload>(
    "post",
    COMMUNICATION_KEY,
    { showSuccessToast: false },
  );

  const mutateWithRefresh: typeof mutation.mutate = (vars, opts) => {
    mutation.mutate(vars, {
      ...opts,
      onSuccess: (...args) => {
        qc.invalidateQueries({
          queryKey: [COMMUNICATION_KEY],
          exact: false,
        });

        opts?.onSuccess?.(...args);
      },
    });
  };

  return { ...mutation, mutate: mutateWithRefresh };
}
// ─── PUT: update ─────────────────────────────────────────────────────────────

export function useUpdateCommunicationWithRefresh() {
  const qc = useQueryClient();
  // endpoint is dynamic: /communication/:id
  const mutation = useApiMutation<Omit<UpdateCommunicationPayload, "id">>(
    "put",
    (vars: any) => `${COMMUNICATION_KEY}/${vars?.id}`,
    { showSuccessToast: false },
  );

  const mutateWithRefresh = (
    payload: UpdateCommunicationPayload,
    opts?: Parameters<typeof mutation.mutate>[1],
  ) => {
    // pass id inside the body so the endpoint fn can read it,
    // the hook strips non-body keys via the "function endpoint" branch
    mutation.mutate(payload as any, {
      ...opts,
      onSuccess: (...args) => {
        qc.invalidateQueries({ queryKey: [COMMUNICATION_KEY] });
        opts?.onSuccess?.(...args);
      },
    });
  };

  return { ...mutation, mutate: mutateWithRefresh };
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export function useDeleteCommunicationWithRefresh() {
  const qc = useQueryClient();
  const mutation = useApiMutation<{ id: number }>(
    "delete",
    (vars: any) => `${COMMUNICATION_KEY}/${vars?.id}`,
    { showSuccessToast: false },
  );

  const mutateWithRefresh = (
    id: number,
    opts?: Parameters<typeof mutation.mutate>[1],
  ) => {
    mutation.mutate({ id } as any, {
      ...opts,
      onSuccess: (...args) => {
        qc.invalidateQueries({ queryKey: [COMMUNICATION_KEY] });
        opts?.onSuccess?.(...args);
      },
    });
  };

  return { ...mutation, mutate: mutateWithRefresh };
}

// ─── POST: reaction ──────────────────────────────────────────────────────────

export function useToggleReactionWithRefresh() {
  const qc = useQueryClient();

  const mutation = useApiMutation<ReactionPayload>(
    "post",
    "/communication-reaction",
    { showSuccessToast: false },
  );

  const mutateWithRefresh = (
    payload: ReactionPayload,
    opts?: Parameters<typeof mutation.mutate>[1],
  ) => {
    mutation.mutate(payload, {
      ...opts,
      onSuccess: (...args) => {
        qc.invalidateQueries({
          queryKey: [COMMUNICATION_KEY],
          exact: false,
        });

        opts?.onSuccess?.(...args);
      },
    });
  };

  return { ...mutation, mutate: mutateWithRefresh };
}
