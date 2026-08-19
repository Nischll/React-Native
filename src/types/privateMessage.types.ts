export interface PrivateInboxItem {
  userId: number;
  fullName: string;
  email: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface PrivateInboxResponse {
  statusCode: number;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    unreadConversationCount: number;
    data: PrivateInboxItem[];
  };
}

export interface PrivateThreadMessage {
  id: number;
  message: string;
  createdDate: string;
  parentId: number | null;
  createdBy: number;
  createdByFullName: string;
  seen: boolean;
  replyUnseenCount?: number;
  reactions?: unknown[];
  replies?: unknown[];
  buildingIds?: number[];
  employeeIds?: number[];
}

export interface PrivateThreadResponse {
  statusCode: number;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    otherUserId: number;
    otherUserFullName: string;
    data: PrivateThreadMessage[];
  };
}

export interface SendPrivateMessagePayload {
  otherUserId: number;
  message: string;
}

export interface PrivateUserOption {
  userId: number;
  fullName: string;
  email?: string;
}

export const PRIVATE_INBOX_LIMIT = 6;
export const PRIVATE_THREAD_LIMIT = 6;
export const PRIVATE_USER_PICKER_LIMIT = 6;
