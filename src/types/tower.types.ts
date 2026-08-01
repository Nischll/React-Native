export interface TowerResponse {
  id: number;
  name: string;
  description?: string;
}

export interface TowerRequest {
  name: string;
  description?: string;
}
