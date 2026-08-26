import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../providers/AuthProvider";
import { UserData } from "../types/auth.types";
import {
  CommunicationItem,
  CommunicationListResponse,
  CreateCommunicationPayload,
  ReactionPayload,
  ReactionUser,
  SeenStatus,
  UpdateCommunicationPayload,
} from "../types/communication.types";
import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { apiService } from "./client";

// ─── Query Key ────────────────────────────────────────────────────────────────

export const COMMUNICATION_KEY = "/communication";
export const COMMUNICATION_UNSEEN_SUMMARY_KEY = "unseen-summary";

function isCommunicationListQueryKey(queryKey: readonly unknown[]) {
  return queryKey[0] === COMMUNICATION_KEY && queryKey[1] !== COMMUNICATION_UNSEEN_SUMMARY_KEY;
}

function toReactionUser(user: UserData): ReactionUser {
  return {
    userId: user.userId,
    firstName: user.firstName,
    middleName: user.middleName ?? null,
    lastName: user.lastName,
    email: user.email,
    fullName: user.fullName,
  };
}

function toggleReactionOnItem(
  item: CommunicationItem,
  communicationId: number,
  reactionType: string,
  actor: ReactionUser,
): CommunicationItem {
  const replies = (item.replies ?? []).map((reply) =>
    toggleReactionOnItem(reply, communicationId, reactionType, actor),
  );

  if (item.id !== communicationId) {
    return replies === item.replies ? item : { ...item, replies };
  }

  const groups = [...(item.reactions ?? [])];
  const index = groups.findIndex((group) => group.reactionType === reactionType);

  if (index === -1) {
    groups.push({
      reactionType,
      count: 1,
      users: [actor],
    });
  } else {
    const group = groups[index];
    const alreadyReacted = (group.users ?? []).some(
      (user) => user.userId === actor.userId,
    );
    if (alreadyReacted) {
      const users = (group.users ?? []).filter(
        (user) => user.userId !== actor.userId,
      );
      if (users.length === 0) {
        groups.splice(index, 1);
      } else {
        groups[index] = { ...group, count: users.length, users };
      }
    } else {
      const users = [...(group.users ?? []), actor];
      groups[index] = { ...group, count: users.length, users };
    }
  }

  return { ...item, reactions: groups, replies };
}

function patchCommunicationReactions(
  qc: ReturnType<typeof useQueryClient>,
  payload: ReactionPayload,
  user: UserData,
) {
  const actor = toReactionUser(user);
  qc.setQueriesData<CommunicationListResponse>(
    { predicate: (query) => isCommunicationListQueryKey(query.queryKey) },
    (current) => {
      const rows = current?.data?.data;
      if (!Array.isArray(rows)) return current;
      return {
        ...current,
        data: {
          ...current.data,
          data: rows.map((row) =>
            toggleReactionOnItem(
              row,
              payload.communicationId,
              payload.reactionType,
              actor,
            ),
          ),
        },
      };
    },
  );
}

function refreshCommunicationLists(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({
    predicate: (query) => isCommunicationListQueryKey(query.queryKey),
    refetchType: "active",
  });
}

function unseenSummaryParams(buildingId?: number) {
  return {
    page: 1,
    limit: 1,
    seenStatus: "all" as const,
    ...(buildingId ? { buildingId } : {}),
  };
}

export function parseManagedBuildingIds(
  buildingList?: Array<{ value: string }> | null,
) {
  return [...new Set(
    (buildingList ?? [])
      .map((building) => Number(building.value))
      .filter((id) => Number.isFinite(id) && id > 0),
  )];
}

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
    axiosConfig: { skipGlobalLoading: true },
    queryParams: {
      page,
      limit,
      seenStatus,
      ...(buildingId ? { buildingId } : {}),
    },
  });
}

export function useGetCommunicationUnseenSummary(
  buildingId?: number,
  enabled = true,
) {
  return useApiQuery<CommunicationListResponse>(
    [COMMUNICATION_KEY, COMMUNICATION_UNSEEN_SUMMARY_KEY],
    {
      enabled,
      retry: 0,
      staleTime: 0,
      refetchOnMount: "always",
      refetchInterval: 10_000,
      axiosConfig: { skipGlobalLoading: true },
      queryParams: unseenSummaryParams(buildingId),
    },
  );
}

/** Unseen thread count from the API. Do not add replyUnseenCount — those threads are already included. */
export function communicationUnseenTotal(unseenCount?: number) {
  return unseenCount ?? 0;
}

/**
 * Everyone count + each building count.
 * Home / tab badge = sum of those group badges.
 */
export function useCommunicationUnseenTotals(
  buildingIds: number[],
  enabled = true,
) {
  const ids = [...new Set(buildingIds.filter((id) => Number.isFinite(id) && id > 0))];
  const scopes: Array<number | undefined> = [undefined, ...ids];

  const queries = useQueries({
    queries: scopes.map((buildingId) => ({
      queryKey: [
        COMMUNICATION_KEY,
        COMMUNICATION_UNSEEN_SUMMARY_KEY,
        JSON.stringify(unseenSummaryParams(buildingId)),
      ],
      enabled,
      retry: 0,
      staleTime: 0,
      refetchOnMount: "always" as const,
      refetchInterval: 10_000,
      queryFn: async () => {
        const response = await apiService.get<CommunicationListResponse>(
          COMMUNICATION_KEY,
          {
            params: unseenSummaryParams(buildingId),
            skipGlobalLoading: true,
          } as any,
        );
        return response.data;
      },
    })),
  });

  const everyoneCount = communicationUnseenTotal(
    queries[0]?.data?.data?.unseenCount,
  );
  const buildingCounts = ids.map((id, index) => ({
    buildingId: id,
    count: communicationUnseenTotal(
      queries[index + 1]?.data?.data?.unseenCount,
    ),
  }));
  const homeTotal =
    everyoneCount + buildingCounts.reduce((sum, row) => sum + row.count, 0);

  return { everyoneCount, buildingCounts, homeTotal };
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
  const { user } = useAuth();

  const mutation = useApiMutation<ReactionPayload>(
    "post",
    "/communication-reaction",
    { showSuccessToast: false, skipGlobalLoading: true },
  );

  const mutateWithRefresh = (
    payload: ReactionPayload,
    opts?: Parameters<typeof mutation.mutate>[1],
  ) => {
    if (user?.userId) {
      patchCommunicationReactions(qc, payload, user);
    }

    mutation.mutate(payload, {
      ...opts,
      onError: (...args) => {
        if (user?.userId) {
          patchCommunicationReactions(qc, payload, user);
        }
        opts?.onError?.(...args);
      },
      onSuccess: (...args) => {
        void refreshCommunicationLists(qc);
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
  for (const [key, payload] of entries) {
    if (Array.isArray(key) && key[1] === COMMUNICATION_UNSEEN_SUMMARY_KEY) {
      continue;
    }
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
