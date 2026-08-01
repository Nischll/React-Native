export interface RecommendationImage {
  id: number;
  fileUrl?: string;
  originalFileName?: string;
}

export interface RecommendationItem {
  id: number;
  buildingId: number;
  buildingName?: string;
  recommendationDate?: string;
  title: string;
  type?: string;
  location?: string;
  description?: string;
  purpose?: string;
  createdByUserName?: string;
  seen?: boolean | null;
  images?: RecommendationImage[];
}

export interface RecommendationRequest {
  buildingId: number;
  recommendationDate: string;
  title: string;
  type?: string;
  location?: string;
  description?: string;
  purpose?: string;
}
