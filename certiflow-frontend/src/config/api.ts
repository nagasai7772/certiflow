
export const API = {
  // Authentication
  login: "/auth/login",

  // Batches
  batches: "/batches",
  createBatch: "/batches",

  batchCandidates: (batchId: string) =>
    `/batches/${batchId}/candidates`,

  uploadCandidates: (batchId: string) =>
    `/batches/${batchId}/candidates/upload`,

  submitBatch: (batchId: string) =>
    `/batches/${batchId}/submit`,

  // Approval workflow
  districtReview: (batchId: string) =>
    `/batches/${batchId}/district-review`,

  qualityReview: (batchId: string) =>
    `/batches/${batchId}/quality-review`,

  stateReview: (batchId: string) =>
    `/batches/${batchId}/state-review`,

  // Certificates
  issueCertificates: (batchId: string) =>
    `/certificates/batches/${batchId}/issue`,
} as const;
