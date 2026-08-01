export interface AmenityResponse {
  id: number;
  name: string;
  description?: string;
}

export interface AmenityRequest {
  name: string;
  description?: string;
}
