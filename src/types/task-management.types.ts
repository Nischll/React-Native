import {
  FollowUpMethod,
  TaskArea,
  TaskCommunicationMode,
  TaskReportedBy,
  TaskType,
} from "../enums/taskEnums";

export type { FollowUpMethod };

export interface AttachmentResponse {
  id: number;
  taskId: number;
  title: string;
}

export interface FollowUpResponse {
  id: number;
  taskId: number;
  followUpDate: string;
  description: string;
  followUpMethod: FollowUpMethod;
  trade: string | null;
}

/** Form / request row for follow-up (id only on existing rows). */
export interface FollowUpRequestRow {
  id?: number;
  followUpDate: string;
  description?: string;
  followUpMethod: FollowUpMethod | "";
  trade?: string;
}

export interface ReactionRequest {
  commentId: number;
  reactionType: string;
  userId?: number;
}

/** User info in task API reaction */
export interface ReactionUser {
  userId: number;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  email: string | null;
  fullName: string;
}

/** Reaction shape from task API (comment.reactions) */
export interface TaskCommentReaction {
  reactionType: string;
  count: number;
  users: ReactionUser[];
}

export interface ReactionResponse {
  id: number;
  commentId: number;
  reactionType: string;
  userId: number;
  userName?: string;
}
export interface CommentResponse {
  id: number;
  message: string;
  taskId: number;
  messageFrom: number;
  messageFromFirstName?: string | null;
  messageFromMiddleName?: string | null;
  messageFromLastName?: string | null;
  messageFromFullName?: string | null;
  messageFromEmail?: string | null;
  messageTo: number;
  messageToFirstName?: string | null;
  messageToMiddleName?: string | null;
  messageToLastName?: string | null;
  messageToFullName?: string | null;
  messageToEmail?: string | null;
  parentId: number | null;
  createdDate?: string | null;
  replies?: CommentResponse[];
  reactions?: TaskCommentReaction[];
}
export interface TaskResponse {
  limit: number;
  page: number;
  total: number;
  data: TaskResponseData[];
}

export interface TaskResponseData {
  id: number;
  taskNumber?: string | null;
  title: string;
  description: string;
  assignedTo: number | null;
  buildingId: number | null;
  residentId?: number | null;
  residentName?: string | null;
  residentUnit?: string | null;
  area?: TaskArea | null;
  type?: TaskType | null;
  subType?: string | null;
  location?: string | null;
  reportedBy?: TaskReportedBy | null;
  modeOfCommunication?: TaskCommunicationMode | null;
  taskStatusId: number | null;
  priority?: TaskPriority;
  createdBy: number;
  createdDate?: string | null;
  assignedEmail: string | null;
  assignedFirstName: string | null;
  assignedMiddleName: string | null;
  assignedLastName: string | null;
  creatorFirstName: string | null;
  creatorMiddleName: string | null;
  creatorLastName: string | null;
  creatorEmail: string | null;
  buildingName: string | null;
  statusName: string | null;
  deadline?: string | null;
  completedDate?: string | null;
  actionTaken?: string | null;
  attachmentResponsePojoList: AttachmentResponse[];
  commentResponsePojoList: CommentResponse[];
  followUpResponsePojoList?: FollowUpResponse[];
}

export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";

export interface Comment {
  id?: number;
  message: string;
  taskId: number;
  messageTo: number | null;
  messageFrom?: number | null;
  parentId?: number;
}

export interface Column {
  id: number;
  title: string;
  order: number;
}

export interface TaskStatus {
  id: number;
  name: string;
  categoryId?: number | null;
  categoryName?: string | null;
  sortingNumber?: number | null;
}

export interface Board {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

export type TaskFilterForm = {
  search: string;
  assignedTo?: number;
  buildingId?: number;
};

export interface CategoryResponse {
  id: number;
  name: string;
}
