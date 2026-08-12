export type ResidentStatus = "OWNER" | "TENANT" | "PROPERTY_AGENT";

export const RESIDENT_STATUS_OPTIONS: { value: ResidentStatus; label: string }[] =
  [
    { value: "OWNER", label: "Owner" },
    { value: "TENANT", label: "Tenant" },
    { value: "PROPERTY_AGENT", label: "Property Agent" },
  ];

export type FobType = "REMOTE" | "KEY_TAG";
export type FobAssignedTo = "TENANT" | "OWNER" | "PROPERTY_AGENT";
export type FobStatus =
  | "ACTIVE"
  | "DISABLED"
  | "DEACTIVATED"
  | "PROGRAMMED"
  | "NOT_PROGRAMMED";

export const FOB_STATUS_OPTIONS: { value: FobStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "DEACTIVATED", label: "Deactivated" },
  { value: "PROGRAMMED", label: "Programmed" },
  { value: "NOT_PROGRAMMED", label: "Not programmed" },
];

export type VisitorPassStatus = "ACTIVE" | "LOST";

// Request/Response types matching backend structure
export interface OwnerRequestPojo {
  fullName: string;
  phoneNumber: string;
  email: string;
  needsEmergencyAssistance: boolean;
  isActive?: boolean;
  activeFromDate?: string | null;
  activeToDate?: string | null;
}

export interface TenantRequestPojo {
  fullName: string;
  phoneNumber: string;
  email?: string;
  emailAddress?: string;
  formKSubmitted: "YES" | "NO" | "UPLOAD";
  formKFile?: File | string;
  formKFilePath?: string;
  formKFileUrl?: string;
  needsEmergencyAssistance: boolean;
  isActive?: boolean;
  activeFromDate?: string | null;
  activeToDate?: string | null;
}

export interface PropertyAgentRequestPojo {
  companyName: string;
  propertyManagerName: string;
  phoneNumber: string;
  email: string;
  isActive?: boolean;
  activeFromDate?: string | null;
  activeToDate?: string | null;
}

export interface AccessDeviceRequestPojo {
  type: FobType;
  cardNumber: string;
  accessLevel: string;
  assignedTo: FobAssignedTo;
  status: FobStatus;
  paidAmount?: string;
  receipt?: string;
  paidType?: PaidType;
  paidNotes?: string;
  isFree?: boolean;
  isPaid?: boolean;
  ownerApproval?: File | string;
  ownerApprovalUrl?: string;
}

export interface VehicleRequestPojo {
  licensePlateNumber: string;
  color: string;
  makeAndModel: string;
}

export interface VisitorPassRequestPojo {
  visitorPassNumber: string;
  dateOfIssue: string;
  status: VisitorPassStatus;
  paidAmount?: string;
  receipt?: string;
  paidType?: PaidType;
  paidNotes?: string;
  isFree?: boolean;
  isPaid?: boolean;
}

export interface EmergencyContactRequestPojo {
  name: string;
  phoneNumber: string;
  relationship: string;
  consentToContact: boolean;
}

export type PaidType = "CASH" | "CHEQUE" | "EFT" | "CARD" | "NONE";

// Rental (recurring payment)
export type PaymentOption = "MONTHLY" | "YEARLY";
export type RentalStatus = "ACTIVE" | "INACTIVE";
export type PurchaseFor =
  | "GARDEN_PLOT"
  | "EV_PARKING"
  | "STRATA_PARKING"
  | "STRATA_STORAGE";

export interface RentalRequestPojo {
  id?: number;
  residentId?: number;
  parkingStall?: string;
  storageNumber?: string;
  gardenNo?: string;
  startDate: string;
  endDate: string;
  paidType: PaidType;
  receipt?: string;
  paidNotes?: string;
  paidAmount?: string;
  paymentOption: PaymentOption;
  status: RentalStatus;
  purchaseFor: PurchaseFor;
  isPaid?: boolean;
}

export interface FilterRequestPojo {
  id?: number;
  residentId?: number;
  typeOfFilter: string;
  size: string;
  noOfFilter: number;
  paidAmount: string;
  receipt: string;
  paidType: PaidType;
  paidNotes: string;
  isPaid?: boolean;
}

export type EnterphoneStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PROGRAMMED"
  | "NOT_PROGRAMMED";

export const ENTERPHONE_STATUS_OPTIONS: {
  value: EnterphoneStatus;
  label: string;
}[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PROGRAMMED", label: "Programmed" },
  { value: "NOT_PROGRAMMED", label: "Not programmed" },
];

export function labelFobStatus(status: string | undefined | null): string {
  if (!status) return "—";
  const hit = FOB_STATUS_OPTIONS.find((o) => o.value === status);
  return hit?.label ?? status.replace(/_/g, " ");
}

export function labelEnterphoneStatus(
  status: string | undefined | null,
): string {
  if (!status) return "—";
  const hit = ENTERPHONE_STATUS_OPTIONS.find((o) => o.value === status);
  return hit?.label ?? status.replace(/_/g, " ");
}

export interface EnterphoneRequestPojo {
  id?: number;
  residentId?: number;
  code: string;
  displayName: string;
  programmedPhoneNumber: string;
  status: EnterphoneStatus;
}

// Basic resident request for initial creation
export interface ResidentBasicRequestPojo {
  buildingId?: number;
  unit: string;
  parkingStall?: string;
  storageLocker?: string;
  status: ResidentStatus;
}

// Request type for creating/updating residents
export interface ResidentRequest {
  id?: number;
  buildingId?: number;
  unit: string;
  parkingStall?: string;
  storageLocker?: string;
  status: ResidentStatus;
  owners?: OwnerRequestPojo[];
  tenants?: TenantRequestPojo[];
  propertyAgents?: PropertyAgentRequestPojo[];
  accessDevices?: AccessDeviceRequestPojo[];
  vehicles?: VehicleRequestPojo[];
  visitorPasses?: VisitorPassRequestPojo[];
  emergencyContacts?: EmergencyContactRequestPojo[];
}

export interface ResidentAttachmentResponse {
  id: number;
  residentId: number;
  title: string;
  filePath: string;
  fileUrl: string;
  originalFileName?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  contentType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ResidentAttachmentView extends ResidentAttachmentResponse {
  displayTitle: string;
  displayName: string;
  inferredMimeType: string;
}

export type ResidentAttachmentUploadInput = {
  title: string;
  file: File;
};

export type ResidentAttachmentUpdateInput = {
  title: string;
  file?: File;
};

// Response type from API
export interface ResidentResponse {
  id: number;
  buildingId?: number;
  buildingAddress?: string;
  buildingName?: string;
  unit: string;
  residentName?: string;
  parkingStall?: string;
  storageLocker?: string;
  status: ResidentStatus;
  owner?: OwnerRequestPojo;
  owners?: OwnerRequestPojo[];
  tenants?: TenantRequestPojo[];
  propertyAgent?: PropertyAgentRequestPojo;
  propertyAgents?: PropertyAgentRequestPojo[];
  accessDevices?: AccessDeviceRequestPojo[];
  vehicles?: VehicleRequestPojo[];
  visitorPasses?: VisitorPassRequestPojo[];
  emergencyContacts?: EmergencyContactRequestPojo[];
  filters?: FilterRequestPojo[];
  enterphones?: EnterphoneRequestPojo[];
  rentals?: (RentalRequestPojo & { id?: number })[];
  documents?: ResidentAttachmentResponse[] | null;
}

export interface ResidentForm {
  id?: number;
  buildingId?: number;
  unit: string;
  parkingStallNumber?: string;
  storageLockerNumber?: string;
  status: ResidentStatus;
  ownerInfo?: OwnerRequestPojo;
  owners?: OwnerRequestPojo[];
  tenants?: TenantRequestPojo[];
  propertyAgentInfo?: PropertyAgentRequestPojo;
  propertyAgents?: PropertyAgentRequestPojo[];
  fobs?: AccessDeviceRequestPojo[];
  vehicles?: VehicleRequestPojo[];
  visitorPasses?: VisitorPassRequestPojo[];
  emergencyContacts?: EmergencyContactRequestPojo[];
}

export interface OwnerInfo extends OwnerRequestPojo {}
export interface TenantInfo extends TenantRequestPojo {}
export interface PropertyAgentInfo extends PropertyAgentRequestPojo {}
export interface FobInfo extends AccessDeviceRequestPojo {}
export interface VehicleInfo extends VehicleRequestPojo {}
export interface VisitorPassInfo extends VisitorPassRequestPojo {}
export interface EmergencyContactInfo extends EmergencyContactRequestPojo {}

export interface Resident extends ResidentForm {}

// ── Sub-entity response types (standalone CRUD screens) ──
// Backend persists these with an id/residentId even though the shared
// request pojos above don't declare them (they're reused for nested create).
export interface OwnerResponse extends OwnerRequestPojo {
  id: number;
  residentId?: number;
}
export interface TenantResponse extends TenantRequestPojo {
  id: number;
  residentId?: number;
}
export interface PropertyAgentResponse extends PropertyAgentRequestPojo {
  id: number;
  residentId?: number;
}
export interface AccessDeviceResponse extends AccessDeviceRequestPojo {
  id: number;
  residentId?: number;
}
export interface VehicleResponse extends VehicleRequestPojo {
  id: number;
  residentId?: number;
}
export interface VisitorPassResponse extends VisitorPassRequestPojo {
  id: number;
  residentId?: number;
}
export interface EmergencyContactResponse extends EmergencyContactRequestPojo {
  id: number;
  residentId?: number;
}
