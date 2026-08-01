export interface AmenityRef {
  id: number;
  name: string;
  description?: string;
}

export interface TowerRef {
  id: number;
  name: string;
  description?: string;
}

export interface Building {
  id: number;
  name: string;
  address: string;
  strataPlan?: string;
  startDate?: string;
  totalFloor?: number;
  noOfUnits?: number;
  amenityIds?: number[];
  amenities?: AmenityRef[];
  towerIds?: number[];
  towers?: TowerRef[];
}

export interface BuildingRequest {
  name: string;
  address: string;
  strataPlan?: string;
  startDate?: string;
  totalFloor?: number;
  noOfUnits?: number;
  amenityIds?: number[];
  towerIds?: number[];
}
