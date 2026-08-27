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
  replyUnseenCount: number;
  replyCount?: number;
}

export interface CommunicationListResponse {
  statusCode: number;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    replyUnseenCount: number;
    seenCount: number;
    unseenCount: number;
    data: CommunicationItem[];
  };
}

export interface CreateCommunicationPayload {
  message: string;
  parentId?: number | null;
  buildingIds?: number[] | null;
}

export interface UpdateCommunicationPayload {
  id: number;
  message: string;
  parentId?: number | null;
  buildingIds?: number[] | null;
}

export interface ReactionPayload {
  communicationId: number;
  reactionType: string;
  userId?: number;
}

export type SeenStatus = "all" | "unseen" | "seen";

export type CommunicationGroup = {
  id: number | "everyone";
  name: string;
};

export const EVERYONE_GROUP: CommunicationGroup = {
  id: "everyone",
  name: "Everyone",
};

export const COMMUNICATION_PAGE_SIZE = 10;
export const COMMUNICATION_GROUP_LIMIT = 10;

function coerceBuildingId(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return coerceBuildingId(JSON.parse(trimmed));
      } catch {
        // fall through to numeric parse
      }
    }
    const asNum = Number(trimmed);
    return Number.isFinite(asNum) && asNum > 0 ? asNum : null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return coerceBuildingId(
      record.id ?? record.value ?? record.buildingId ?? record.building_id,
    );
  }
  return null;
}

function asRawIdList(value: unknown): unknown[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "number") return [value];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return trimmed.split(/[,\s]+/).filter(Boolean);
      }
    }
    return trimmed.split(/[,\s]+/).filter(Boolean);
  }
  if (typeof value === "object") return [value];
  return [];
}

/** Positive building IDs from whatever shape the API sent. */
export function getCommunicationBuildingIds(item: unknown): number[] {
  if (item == null || typeof item !== "object") return [];
  const record = item as Record<string, unknown>;
  const ids: number[] = [];
  for (const bucket of [
    record.buildingIds,
    record.targetBuildingIds,
    record.targetBuildings,
    record.buildings,
  ]) {
    for (const value of asRawIdList(bucket)) {
      const id = coerceBuildingId(value);
      if (id != null) ids.push(id);
    }
  }
  return [...new Set(ids)];
}

export function isEveryoneBroadcast(item: unknown) {
  return getCommunicationBuildingIds(item).length === 0;
}

export function matchesCommunicationGroup(
  item: unknown,
  groupId: CommunicationGroup["id"],
) {
  const ids = getCommunicationBuildingIds(item);
  if (groupId === "everyone") return ids.length === 0;
  return ids.includes(Number(groupId));
}
