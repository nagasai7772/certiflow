import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, RotateCcw, X } from "lucide-react";
import { getBatches, reviewBatch } from "../services/batch.service";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";
import StatusBadge from "../components/StatusBadge";
import { getErrorMessage } from "../lib/http";

const config: Record<string, { title: string; subtitle: string; role: UserRole; stage: string }> = {
  DISTRICT_OFFICER: { title: "District review queue", subtitle: "Review submitted batches assigned to your district.", role: "DISTRICT_OFFICER", stage: "SUBMITTED" },
  QUALITY_OFFICER: { title: "Quality review queue", subtitle: "Verify batches that have passed district review.", role: "QUALITY_OFFICER", stage: "QUALITY_REVIEW" },
  STATE_OFFICER: { title: "State review queue", subtitle: "Complete final review before certificates can be issued.", role: "STATE_OFFICER", stage: "STATE_REVIEW" },
};

export default function ReviewPage() {
  const { user } = useAuth();
  const current = config[user?.role ?? "DISTRICT_OFFICER"];
  const { data: batches = [], isLoading, isError, error } = useQuery({ queryKey: ["batches"], queryFn: getBatches });
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | "RETURNED">("APPROVED");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const queue = batches.filter((b) => b.status === current.stage || (user?.role === "DISTRICT_OFFICER" && b.status === "SUBMITTED"));

  const mutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Select a batch first.");
      return reviewBatch(selected, current.role as "DISTRICT_OFFICER" | "QUALITY_OFFICER" | "STATE_OFFICER", { decision, comment });
    },
    onSuccess: () => { setMessage(`Batch review submitted: ${decision.toLowerCase()}.`); setSelected(null); setComment(""); qc.invalidateQueries({ queryKey: ["batches"] }); },
  });

  return <div className="page-stack">
    <section className="page-intro"><div><div className="eyebrow">APPROVAL WORKFLOW</div><h2>{current.title}</h2><p>{current.subtitle}</p></div><div className="count-chip">{queue.length} awaiting review</div></section>
    {message && <div className="success-strip"><Check size={17} />{message}</div>}
    {mutation.error && <div className="inline-alert">{getErrorMessage(mutation.error)}</div>}
    <section className="panel">
      <div className="panel-heading"><div><h3>Pending submissions</h3><p>Only batches at your current workflow stage are shown.</p></div></div>
      {isLoading ? <div className="empty-state">Loading review queue...</div> : isError ? <div className="inline-alert">{getErrorMessage(error)}</div> : queue.length === 0 ? <div className="empty-state"><div className="empty-icon"><ClipboardCheck size={22} /></div><strong>You're all caught up</strong><span>No batches are currently waiting at this stage.</span></div> :
        <div className="review-list">{queue.map((batch) => <div className={`review-item ${selected === batch.id ? "review-selected" : ""}`} key={batch.id}>
          <div className="review-main"><div className="review-icon"><ClipboardCheck size={19} /></div><div><strong>{batch.batchCode}</strong><span>{batch.name} · {batch.trainingCentre?.name ?? "Training centre"}</span><small>Version {batch.currentSubmissionVersion ?? 1}</small></div></div>
          <StatusBadge status={batch.status} />
          <button className="secondary-button compact" onClick={() => { setSelected(selected === batch.id ? null : batch.id); setDecision("APPROVED"); setComment(""); }}> {selected === batch.id ? "Close" : "Review"} </button>
          {selected === batch.id && <div className="decision-panel">
            <div className="field"><label>Decision</label><div className="decision-options">
              <button type="button" className={decision === "APPROVED" ? "decision-option chosen approve" : "decision-option"} onClick={() => setDecision("APPROVED")}><Check size={15} /> Approve</button>
              <button type="button" className={decision === "RETURNED" ? "decision-option chosen return" : "decision-option"} onClick={() => setDecision("RETURNED")}><RotateCcw size={15} /> Return</button>
              <button type="button" className={decision === "REJECTED" ? "decision-option chosen reject" : "decision-option"} onClick={() => setDecision("REJECTED")}><X size={15} /> Reject</button>
            </div></div>
            <div className="field"><label>Comment {decision !== "APPROVED" && <span className="required-label">Required</span>}</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add review notes or explain the reason for returning/rejecting..." rows={3} /></div>
            <div className="decision-footer"><span>Review actions are recorded in the audit log.</span><button className="primary-button" disabled={mutation.isPending || (decision !== "APPROVED" && !comment.trim())} onClick={() => mutation.mutate()}>{mutation.isPending ? "Submitting..." : "Submit decision"}</button></div>
          </div>}
        </div>)}</div>}
    </section>
  </div>;
}
