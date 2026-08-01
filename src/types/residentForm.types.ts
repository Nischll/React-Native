export interface ResidentForm {
  id: number;
  title: string;
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  createdDate?: string;
}

export interface ResidentFormForward {
  id: number;
  residentId: number;
  residentFormId: number;
  residentFormTitle?: string;
  residentFormFileName?: string;
  residentName?: string;
  residentEmail?: string;
  residentUnit?: string;
  buildingName?: string;
  subject?: string;
  message?: string;
  sentAt?: string;
  createdDate?: string;
}

export interface ForwardResidentFormsRequest {
  residentId: number;
  residentFormIds: number[];
  subject?: string;
  message?: string;
}
