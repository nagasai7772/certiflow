export type UserRole = "TRAINING_CENTRE" | "DISTRICT_OFFICER" | "QUALITY_OFFICER" | "STATE_OFFICER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district?: string | null;
  trainingCentreId?: string | null;
}

export type BatchStatus =
  | "DRAFT" | "SUBMITTED" | "DISTRICT_REVIEW" | "QUALITY_REVIEW"
  | "STATE_REVIEW" | "RETURNED" | "REJECTED" | "APPROVED";

export interface Batch {
  id: string;
  batchCode: string;
  name: string;
  status: BatchStatus;
  currentSubmissionVersion?: number;
  submittedAt?: string | null;
  createdAt?: string;
  candidateCount?: number;
  trainingCentre?: { name: string; code?: string; district?: string };
}

export interface Candidate {
  id: string;
  registrationNumber: string;
  fullName: string;
  email?: string | null;
  phone?: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  candidateId: string;
  fileKey: string;
  status: "ISSUED" | "CANCELLED";
  issuedAt: string;
}
