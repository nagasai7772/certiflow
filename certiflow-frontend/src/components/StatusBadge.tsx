import type { BatchStatus } from "../types";

const labels: Record<BatchStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  DISTRICT_REVIEW: "District review",
  QUALITY_REVIEW: "Quality review",
  STATE_REVIEW: "State review",
  RETURNED: "Returned",
  REJECTED: "Rejected",
  APPROVED: "Approved",
};

export default function StatusBadge({ status }: { status: BatchStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{labels[status] ?? status}</span>;
}
