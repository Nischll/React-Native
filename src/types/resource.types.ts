export type ResourceType =
  | "BUILDING_INFORMATION"
  | "SOP"
  | "COMPANY_INFORMATION_AND_POLICY";

export const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string }[] = [
  { value: "BUILDING_INFORMATION", label: "Building Information" },
  { value: "SOP", label: "SOP" },
  { value: "COMPANY_INFORMATION_AND_POLICY", label: "Company Info & Policy" },
];

export interface ResourceAttachment {
  id: number;
  storedPath?: string;
  originalFileName?: string;
  fileSizeBytes?: number;
  fileSizeDisplay?: string;
  fileUrl?: string;
}

export interface ResourceItem {
  id: number;
  type: ResourceType;
  fileName: string;
  fileSizeBytes?: number;
  fileSizeDisplay?: string;
  description?: string;
  createdByUserName?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  attachments?: ResourceAttachment[];
}
