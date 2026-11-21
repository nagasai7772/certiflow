import { http } from "../lib/http";
import { API } from "../config/api";
import type { Batch, Candidate } from "../types";

type ApiList<T> = { data?: T[]; batches?: T[]; candidates?: T[] };

export async function getBatches(): Promise<Batch[]> {
  const { data } = await http.get(API.batches);
  const body = data?.data ?? data;
  if (Array.isArray(body)) return body;
  return (body as ApiList<Batch>)?.batches ?? [];
}

export async function createBatch(input: { batchCode: string; name: string }) {
  const { data } = await http.post(API.createBatch, input);
  return data?.data ?? data;
}

export async function getCandidates(batchId: string): Promise<Candidate[]> {
  const { data } = await http.get(API.batchCandidates(batchId));
  const body = data?.data ?? data;
  if (Array.isArray(body)) return body;
  return (body as ApiList<Candidate>)?.candidates ?? [];
}

export async function uploadCandidates(batchId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await http.post(API.uploadCandidates(batchId), form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data ?? data;
}

export async function submitBatch(batchId: string) {
  const { data } = await http.post(API.submitBatch(batchId));
  return data?.data ?? data;
}

export async function reviewBatch(
  batchId: string,
  role: "DISTRICT_OFFICER" | "QUALITY_OFFICER" | "STATE_OFFICER",
  input: { decision: "APPROVED" | "REJECTED" | "RETURNED"; comment?: string },
) {
  const endpoint = role === "DISTRICT_OFFICER"
    ? API.districtReview(batchId)
    : role === "QUALITY_OFFICER"
      ? API.qualityReview(batchId)
      : API.stateReview(batchId);
  const { data } = await http.post(endpoint, input);
  return data?.data ?? data;
}

export async function issueCertificates(batchId: string) {
  const { data } = await http.post(API.issueCertificates(batchId));
  return data?.data ?? data;
}
