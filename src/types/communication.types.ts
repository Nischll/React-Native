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
  userId: number;
}

export type SeenStatus = "all" | "unseen" | "seen";
