export interface TaskStatus {
  id: number;
  name: string;
  categoryId?: number | null;
  categoryName?: string | null;
  sortingNumber?: number | null;
}

export interface TaskStatusRequest {
  name: string;
  categoryId?: number | null;
  sortingNumber?: number | null;
}
