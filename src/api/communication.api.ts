import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  CommunicationItem,
  CommunicationListResponse,
  CreateCommunicationPayload,
  ReactionPayload,
  SeenStatus,
  UpdateCommunicationPayload,
} from "../types/communication.types";

// ─── Query Key ────────────────────────────────────────────────────────────────

export const COMMUNICATION_KEY = "/communication";

// ─── GET: list ────────────────────────────────────────────────────────────────

export function useGetCommunications(
  page = 1,
  limit = 10,
  seenStatus: SeenStatus = "all",
  buildingId?: number,
  enabled = true,
) {
  return useApiQuery<CommunicationListResponse>(COMMUNICATION_KEY, {
    enabled,
    retry: 0,
    queryParams: {
      page,
      limit,
      seenStatus,
      ...(buildingId ? { buildingId } : {}),
    },
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

export function findCommunicationInCache(
  qc: ReturnType<typeof useQueryClient>,
  id: number,
): CommunicationItem | undefined {
  let best: CommunicationItem | undefined;
  let bestScore = -1;
  const entries = qc.getQueriesData<CommunicationListResponse>({
    queryKey: [COMMUNICATION_KEY],
  });
  for (const [, payload] of entries) {
    const rows = payload?.data?.data;
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (row?.id !== id) continue;
      const score =
        (Array.isArray(row.replies) ? row.replies.length : 0) +
        (typeof row.replyCount === "number" ? row.replyCount : 0);
      if (score > bestScore) {
        best = row;
        bestScore = score;
      }
    }
  }
  return best;
}

export function getReplyCount(item: CommunicationItem): number {
  const replies = Array.isArray(item.replies) ? item.replies : [];
  const nested = replies.reduce(
    (sum, reply) => sum + 1 + getReplyCount(reply),
    0,
  );
  const explicit =
    typeof item.replyCount === "number" && Number.isFinite(item.replyCount)
      ? item.replyCount
      : 0;
  const unseen =
    typeof item.replyUnseenCount === "number" &&
    Number.isFinite(item.replyUnseenCount)
      ? item.replyUnseenCount
      : 0;
  return Math.max(explicit, nested, unseen);
}

/** Turns a flat or nested reply list into a tree under the original post. */
export function buildReplyTree(
  rootId: number,
  replies: CommunicationItem[],
): CommunicationItem[] {
  if (!Array.isArray(replies) || replies.length === 0) return [];

  const alreadyNested = replies.some(
    (reply) => Array.isArray(reply.replies) && reply.replies.length > 0,
  );
  if (alreadyNested) return replies;

  const nodes = new Map<number, CommunicationItem>();
  for (const reply of replies) {
    nodes.set(reply.id, { ...reply, replies: [] });
  }

  const roots: CommunicationItem[] = [];
  for (const reply of replies) {
    const node = nodes.get(reply.id);
    if (!node) continue;
    const parent = reply.parentId;
    if (parent != null && parent !== rootId && nodes.has(parent)) {
      nodes.get(parent)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
